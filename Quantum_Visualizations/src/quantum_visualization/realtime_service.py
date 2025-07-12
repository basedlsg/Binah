import time
import zmq
import numpy as np
import logging
from typing import List, Optional
import os
import json
from datetime import datetime

from .proto import messages_pb2
from .quantum_backends import quantum_manager

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class RealtimeOptimizationService:
    def __init__(self, update_rate_ms: int = 500):
        self.update_rate_ms = update_rate_ms
        self.learning_rate = 0.01
        self.active_problem = "sombrero"  # Default to the toy problem
        
        self.is_paused = False
        self.reset_optimization_state()

        # ZMQ Setup
        self.context = zmq.Context()
        self.pub_socket = self.context.socket(zmq.PUB)
        self.pub_socket.bind("tcp://*:5555")
        self.sub_socket = self.context.socket(zmq.SUB)
        self.sub_socket.bind("tcp://*:5556")
        self.sub_socket.setsockopt(zmq.SUBSCRIBE, b"")
        self.sub_socket.setsockopt(zmq.RCVTIMEO, 10)
        
        logger.info(f"Service initialized with {update_rate_ms}ms update rate")
        # Note: quantum_backends.py now initializes the manager itself
        
    def reset_optimization_state(self):
        """Resets the optimization to its initial state for the current problem."""
        logger.info(f"Resetting optimization state for problem: {self.active_problem}")
        
        if self.active_problem == "sombrero":
            num_params = 10
        else:
            # This logic needs to be robust to the problem not being quantum
            try:
                hamiltonian = quantum_manager.problems[self.active_problem]["hamiltonian"]
                # Based on the TwoLocal ansatz in quantum_backends
                num_params = hamiltonian.num_qubits * 3 # Simplified; a more robust way would be to get from ansatz
            except (KeyError, AttributeError):
                 logger.error(f"Could not determine num_params for {self.active_problem}, defaulting to 10.")
                 num_params = 10


        self.params = np.random.randn(num_params) * 0.1
        self.trajectory_id = f"opt_run_{int(time.time())}"
        self.step_count = 0
        self.data_history = []
        
        update = messages_pb2.RealtimeUpdate()
        update.reset_confirmation.success = True
        self.pub_socket.send(update.SerializeToString())

    def get_current_loss(self, params: np.ndarray) -> float:
        """Calculates the loss for the current active problem."""
        if self.active_problem == "sombrero":
            return self.sombrero_loss(params)
        else:
            try:
                # Assuming a quantum problem
                result = quantum_manager.execute_quantum_vqe(params, shots=1024)
                logger.debug(f"VQE Loss: {result.loss_value:.6f}, Time: {result.execution_time:.2f}s")
                return result.loss_value
            except Exception as e:
                logger.error(f"VQE execution failed: {e}")
                return np.inf # Return a high loss value on failure

    def sombrero_loss(self, params: np.ndarray) -> float:
        """Sombrero function - creates a landscape with a global minimum surrounded by a ridge"""
        x, y = params[0], params[1]
        r = np.sqrt(x**2 + y**2)
        
        if r < 1e-6:
            return 0.0
        else:
            return (np.sin(r) / r) ** 2 + 0.1 * np.sum(params[2:] ** 2)

    def compute_gradient(self, params: np.ndarray) -> np.ndarray:
        """Compute gradient using finite differences for the active problem."""
        grad = np.zeros_like(params)
        eps = 1e-4 # A slightly larger epsilon can be more stable for noisy functions
        
        for i in range(len(params)):
            params_plus = params.copy()
            params_minus = params.copy()
            params_plus[i] += eps
            params_minus[i] -= eps
            
            loss_plus = self.get_current_loss(params_plus)
            loss_minus = self.get_current_loss(params_minus)
            
            grad[i] = (loss_plus - loss_minus) / (2 * eps)
        
        return grad

    def handle_control_events(self):
        """Process control events from the frontend"""
        try:
            while True:
                msg = self.sub_socket.recv(flags=zmq.NOBLOCK)
                event = messages_pb2.UIEvent()
                event.ParseFromString(msg)
                
                if event.control_id == "learning_rate":
                    self.learning_rate = event.float_value
                elif event.control_id == "update_rate":
                    self.update_rate_ms = int(event.float_value)
                elif event.control_id == "quantum_backend":
                    try:
                        quantum_manager.set_active_backend(event.string_value)
                    except ValueError as e:
                        logger.error(e)
                elif event.control_id == "set_problem":
                    if self.active_problem != event.string_value:
                        self.active_problem = event.string_value
                        quantum_manager.set_active_problem(self.active_problem)
                        self.reset_optimization_state()
                elif event.control_id == "set_paused":
                    self.is_paused = event.bool_value
                    logger.info(f"Execution {'paused' if self.is_paused else 'resumed'}.")
                elif event.control_id == "reset":
                    self.reset_optimization_state()
                elif event.control_id == "save_experiment":
                    self.save_experiment()
                    
        except zmq.Again:
            pass
    
    def save_experiment(self):
        """Saves the current optimization history to a file."""
        if not os.path.exists("experiments"):
            os.makedirs("experiments")
            
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"experiments/exp_{self.active_problem}_{timestamp}.json"
        
        backend_name = "classical"
        if self.active_problem != 'sombrero' and quantum_manager.active_backend:
            backend_name = quantum_manager.active_backend.backend_name

        experiment_data = {
            "metadata": {
                "problem": self.active_problem,
                "timestamp": timestamp,
                "quantum_backend": backend_name,
                "learning_rate": self.learning_rate,
                "total_steps": self.step_count,
            },
            "history": self.data_history
        }
        
        try:
            with open(filename, "w") as f:
                json.dump(experiment_data, f, indent=2)
            logger.info(f"Experiment saved to {filename}")
            
            confirmation = messages_pb2.RealtimeUpdate()
            confirmation.save_confirmation.filepath = filename
            self.pub_socket.send(confirmation.SerializeToString())
        except Exception as e:
            logger.error(f"Failed to save experiment: {e}")


    def run(self):
        """Main optimization loop with controlled updates"""
        logger.info("Starting optimization service...")
        
        while True:
            try:
                self.handle_control_events()
                
                if not self.is_paused:
                    current_loss = self.get_current_loss(self.params)
                    
                    if np.isinf(current_loss):
                        logger.error("Loss is infinite, pausing optimization. Check backend.")
                        self.is_paused = True
                        continue

                    gradient = self.compute_gradient(self.params)
                    self.params -= self.learning_rate * gradient
                    
                    self.data_history.append({
                        "step": self.step_count,
                        "loss": current_loss,
                        "params": self.params.tolist() if isinstance(self.params, np.ndarray) else self.params
                    })

                    if self.step_count % 50 == 0:
                        self.params += np.random.randn(len(self.params)) * 0.001
                    
                    self.step_count += 1
                    
                    update = messages_pb2.RealtimeUpdate()
                    traj = update.trajectory
                    traj.id = self.trajectory_id
                    traj.loss_value = current_loss
                    
                    for param in self.params:
                        traj.full_params.append(float(param))

                    self.pub_socket.send(update.SerializeToString())
                    
                    if self.step_count % 5 == 0:
                        problem_info = f"({self.active_problem})"
                        logger.info(f"Step {self.step_count}: Loss = {current_loss:.6f} {problem_info}")

                time.sleep(self.update_rate_ms / 1000.0)
                
            except KeyboardInterrupt:
                logger.info("Service interrupted by user")
                break
            except Exception as e:
                logger.error(f"Error in optimization loop: {e}", exc_info=True)
                time.sleep(1)

        self.pub_socket.close()
        self.sub_socket.close()
        self.context.term()
        logger.info("Service stopped")


if __name__ == "__main__":
    service = RealtimeOptimizationService()
    service.run() 