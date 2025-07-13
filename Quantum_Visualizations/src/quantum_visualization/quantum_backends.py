"""
Quantum Computing Backends Integration
Supports AWS Braket, IBM Quantum, and local simulators
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from abc import ABC, abstractmethod
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor

# --- Problem Definition ---
from .problems import get_h2_hamiltonian

# AWS Braket imports
try:
    from braket.circuits import Circuit
    from braket.devices import LocalSimulator
    from braket.aws import AwsDevice
    import boto3
    BRAKET_AVAILABLE = True
except ImportError:
    BRAKET_AVAILABLE = False
    print("AWS Braket not available. Install with: pip install amazon-braket-sdk")

# Qiskit imports
try:
    from qiskit import QuantumCircuit, transpile
    from qiskit.providers.aer import AerSimulator
    from qiskit_ibm_runtime import QiskitRuntimeService
    from qiskit.circuit.library import TwoLocal
    from qiskit.algorithms.minimum_eigensolvers import VQE
    from qiskit.algorithms.optimizers import SPSA
    from qiskit.primitives import Estimator
    from qiskit.quantum_info import SparsePauliOp
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False
    print("Qiskit not available. Install with: pip install qiskit qiskit-nature")

logger = logging.getLogger(__name__)

@dataclass
class QuantumResult:
    """Result from quantum computation"""
    params: np.ndarray
    loss_value: float
    backend_name: str
    execution_time: float
    shots: int
    metadata: Dict = None

class QuantumBackend(ABC):
    """Abstract base class for quantum backends"""
    
    @abstractmethod
    def execute_vqe_step(self, params: np.ndarray, hamiltonian: 'SparsePauliOp', shots: int = 1000) -> QuantumResult:
        """Execute a single VQE optimization step"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if backend is available"""
        pass
    
    @abstractmethod
    def get_device_info(self) -> Dict:
        """Get information about the quantum device"""
        pass

class BraketBackend(QuantumBackend):
    """AWS Braket quantum backend"""
    
    def __init__(self, device_arn: Optional[str] = None, s3_bucket: Optional[str] = None):
        if not BRAKET_AVAILABLE:
            raise ImportError("AWS Braket SDK not available")
        
        self.device_arn = device_arn
        self.s3_bucket = s3_bucket
        self.session = boto3.Session()
        
        if device_arn:
            self.device = AwsDevice(device_arn)
            self.is_simulator = False
        else:
            self.device = LocalSimulator()
            self.is_simulator = True
        
        self.backend_name = str(self.device.name)
        logger.info(f"Initialized Braket backend: {self.backend_name}")
    
    def execute_vqe_step(self, params: np.ndarray, hamiltonian: 'SparsePauliOp', shots: int = 1000) -> QuantumResult:
        """Execute VQE step on Braket device"""
        import time
        start_time = time.time()
        
        logger.warning("Braket VQE step is a simulation. For full hardware execution, a provider like qiskit-braket is needed.")
        
        # This is a mock calculation for demonstration.
        loss_value = np.sum(np.sin(params)) + np.random.normal(0, 0.05)
        
        execution_time = time.time() - start_time

        return QuantumResult(
            params=params,
            loss_value=loss_value,
            backend_name=self.backend_name,
            execution_time=execution_time,
            shots=shots,
            metadata={"simulated_step": True}
        )
    
    def is_available(self) -> bool:
        """Check if Braket backend is available"""
        return True # For local simulator
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        return {"name": self.backend_name, "type": "simulator", "status": "available"}

class QiskitBackend(QuantumBackend):
    """IBM Qiskit quantum backend"""
    
    def __init__(self, backend_name: str = "aer_simulator", token: Optional[str] = None):
        if not QISKIT_AVAILABLE:
            raise ImportError("Qiskit not available")
        
        self.backend_name = backend_name
        self.backend = AerSimulator()
        self.estimator = Estimator()
        
        logger.info(f"Initialized Qiskit backend: {self.backend_name}")
    
    def execute_vqe_step(self, params: np.ndarray, hamiltonian: 'SparsePauliOp', shots: int = 1000) -> QuantumResult:
        """
        Executes a single evaluation step of a VQE algorithm.
        """
        import time
        start_time = time.time()
        
        try:
            num_qubits = hamiltonian.num_qubits
            ansatz = TwoLocal(num_qubits, "ry", "cz", reps=2, entanglement='linear')
            
            job = self.estimator.run([(ansatz, hamiltonian, [params])], shots=shots)
            result = job.result()
            
            expectation_value = result.values[0]
            
            execution_time = time.time() - start_time
            
            return QuantumResult(
                params=params,
                loss_value=expectation_value,
                backend_name=self.backend_name,
                execution_time=execution_time,
                shots=shots,
                metadata=result.metadata[0]
            )
        except Exception as e:
            logger.error(f"Error executing VQE step on Qiskit: {e}")
            raise

    def is_available(self) -> bool:
        return True

    def get_device_info(self) -> Dict:
        return {"name": self.backend_name, "type": "simulator", "status": "available"}

class QuantumBackendManager:
    """Manages multiple quantum backends"""
    
    def __init__(self):
        self.backends: Dict[str, QuantumBackend] = {}
        self.active_backend_name = None
        self.active_backend: Optional[QuantumBackend] = None
        self.executor = ThreadPoolExecutor(max_workers=3)
        
        self.problems = {
            "h2_molecule": {
                "hamiltonian": get_h2_hamiltonian(),
                "description": "Hydrogen Molecule Ground State Energy (VQE)"
            }
        }
        self.active_problem = "h2_molecule"

    def add_backend(self, backend: QuantumBackend, name: str):
        self.backends[name] = backend
        if not self.active_backend:
            self.set_active_backend(name)

    def set_active_backend(self, name: str):
        if name in self.backends:
            self.active_backend_name = name
            self.active_backend = self.backends[name]
            logger.info(f"Set active backend: {name}")
        else:
            raise ValueError(f"Backend {name} not found")
            
    def set_active_problem(self, problem_name: str):
        if problem_name in self.problems or problem_name == "sombrero":
            self.active_problem = problem_name
            logger.info(f"Set active problem to: {problem_name}")
        else:
            raise ValueError(f"Problem '{problem_name}' not found.")

    def get_available_backends(self) -> List[Dict]:
        return [{"backend_name": name, **b.get_device_info()} for name, b in self.backends.items()]
    
    def execute_quantum_vqe(self, params: np.ndarray, shots: int = 1024) -> QuantumResult:
        if not self.active_backend:
            raise ValueError("No active backend configured")
        
        hamiltonian = self.problems[self.active_problem]["hamiltonian"]
        
        # Ensure parameters match the problem's ansatz
        num_expected_params = TwoLocal(hamiltonian.num_qubits, "ry", "cz", reps=2).num_parameters
        if len(params) != num_expected_params:
             logger.warning(f"Resizing parameters: expected {num_expected_params}, got {len(params)}")
             new_params = np.random.randn(num_expected_params) * 0.1
             # This is a simple reset, more sophisticated resizing could be implemented
             params = new_params


        return self.active_backend.execute_vqe_step(params, hamiltonian, shots)

quantum_manager = QuantumBackendManager()

if QISKIT_AVAILABLE:
    quantum_manager.add_backend(QiskitBackend(), name="qiskit_aer")
if BRAKET_AVAILABLE:
    quantum_manager.add_backend(BraketBackend(), name="braket_local")

if not quantum_manager.backends:
    logger.warning("No quantum backends were initialized.")
else:
    # Set a default active backend
    first_backend_name = next(iter(quantum_manager.backends))
    quantum_manager.set_active_backend(first_backend_name) 
        except Exception as e:
            logger.error(f"Error executing on Braket: {e}")
            # Fallback to classical calculation
            return self._classical_fallback(params, shots)
    
    def _bitstring_to_energy(self, bitstring: str, params: np.ndarray) -> float:
        """Convert measurement bitstring to energy value"""
        # Simple mapping: count number of 1s and relate to sombrero function
        ones_count = bitstring.count('1')
        n_qubits = len(bitstring)
        
        # Normalize to [-1, 1] range
        normalized = (2 * ones_count / n_qubits) - 1
        
        # Apply sombrero-like function
        x, y = params[0], params[1] if len(params) > 1 else 0
        r = np.sqrt(x**2 + y**2)
        
        if r < 1e-6:
            return 0.0
        else:
            base_energy = (np.sin(r) / r) ** 2
            quantum_correction = normalized * 0.1  # Small quantum correction
            return base_energy + quantum_correction
    
    def _classical_fallback(self, params: np.ndarray, shots: int) -> QuantumResult:
        """Classical fallback calculation"""
        import time
        start_time = time.time()
        
        # Classical sombrero function
        x, y = params[0], params[1] if len(params) > 1 else 0
        r = np.sqrt(x**2 + y**2)
        
        if r < 1e-6:
            loss_value = 0.0
        else:
            loss_value = (np.sin(r) / r) ** 2 + 0.1 * np.sum(params[2:] ** 2)
        
        execution_time = time.time() - start_time
        
        return QuantumResult(
            params=params,
            loss_value=loss_value,
            backend_name="classical_fallback",
            execution_time=execution_time,
            shots=shots,
            metadata={"fallback": True}
        )
    
    def is_available(self) -> bool:
        """Check if Braket backend is available"""
        try:
            if self.is_simulator:
                return True
            else:
                # Check device status
                device_info = self.device.aws_device.status
                return device_info == "ONLINE"
        except:
            return False
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        try:
            if self.is_simulator:
                return {
                    "name": "Local Simulator",
                    "type": "simulator",
                    "status": "available",
                    "qubits": "unlimited"
                }
            else:
                device = self.device.aws_device
                return {
                    "name": device.name,
                    "type": device.type,
                    "status": device.status,
                    "provider": device.provider_name,
                    "qubits": getattr(device.properties, 'paradigm', {}).get('qubitCount', 'unknown')
                }
        except:
            return {"name": "Unknown", "type": "unknown", "status": "error"}

class QiskitBackend(QuantumBackend):
    """IBM Qiskit quantum backend"""
    
    def __init__(self, backend_name: str = "aer_simulator", token: Optional[str] = None):
        if not QISKIT_AVAILABLE:
            raise ImportError("Qiskit not available")
        
        self.backend_name = backend_name
        
        if backend_name == "aer_simulator":
            self.backend = AerSimulator()
            self.is_simulator = True
        else:
            # IBM Quantum backend
            if token:
                service = QiskitRuntimeService(channel="ibm_quantum", token=token)
            else:
                service = QiskitRuntimeService()
            
            self.backend = service.backend(backend_name)
            self.is_simulator = False
        
        logger.info(f"Initialized Qiskit backend: {backend_name}")
    
    def create_vqe_circuit(self, params: np.ndarray) -> QuantumCircuit:
        """Create VQE circuit for Qiskit"""
        n_qubits = min(len(params), 10)
        
        circuit = QuantumCircuit(n_qubits, n_qubits)
        
        # Initialize superposition
        for i in range(n_qubits):
            circuit.h(i)
        
        # Parameterized ansatz
        for layer in range(2):
            for i in range(n_qubits):
                param_idx = (layer * n_qubits + i) % len(params)
                circuit.ry(params[param_idx], i)
            
            for i in range(n_qubits - 1):
                circuit.cx(i, i + 1)
        
        # Measurements
        circuit.measure_all()
        
        return circuit
    
    def execute_vqe_step(self, params: np.ndarray, shots: int = 1000) -> QuantumResult:
        """Execute VQE step on Qiskit backend"""
        import time
        start_time = time.time()
        
        try:
            circuit = self.create_vqe_circuit(params)
            
            # Transpile for backend
            transpiled = transpile(circuit, self.backend)
            
            # Execute
            job = self.backend.run(transpiled, shots=shots)
            result = job.result()
            counts = result.get_counts()
            
            # Calculate expectation value
            expectation = 0.0
            total_shots = sum(counts.values())
            
            for bitstring, count in counts.items():
                energy = self._bitstring_to_energy(bitstring, params)
                expectation += energy * (count / total_shots)
            
            execution_time = time.time() - start_time
            
            return QuantumResult(
                params=params,
                loss_value=expectation,
                backend_name=self.backend_name,
                execution_time=execution_time,
                shots=shots,
                metadata={"counts": counts}
            )
            
        except Exception as e:
            logger.error(f"Error executing on Qiskit: {e}")
            return self._classical_fallback(params, shots)
    
    def _bitstring_to_energy(self, bitstring: str, params: np.ndarray) -> float:
        """Convert bitstring to energy (same as Braket)"""
        ones_count = bitstring.count('1')
        n_qubits = len(bitstring)
        normalized = (2 * ones_count / n_qubits) - 1
        
        x, y = params[0], params[1] if len(params) > 1 else 0
        r = np.sqrt(x**2 + y**2)
        
        if r < 1e-6:
            return 0.0
        else:
            base_energy = (np.sin(r) / r) ** 2
            quantum_correction = normalized * 0.1
            return base_energy + quantum_correction
    
    def _classical_fallback(self, params: np.ndarray, shots: int) -> QuantumResult:
        """Classical fallback (same as Braket)"""
        import time
        start_time = time.time()
        
        x, y = params[0], params[1] if len(params) > 1 else 0
        r = np.sqrt(x**2 + y**2)
        
        if r < 1e-6:
            loss_value = 0.0
        else:
            loss_value = (np.sin(r) / r) ** 2 + 0.1 * np.sum(params[2:] ** 2)
        
        execution_time = time.time() - start_time
        
        return QuantumResult(
            params=params,
            loss_value=loss_value,
            backend_name="classical_fallback",
            execution_time=execution_time,
            shots=shots,
            metadata={"fallback": True}
        )
    
    def is_available(self) -> bool:
        """Check if Qiskit backend is available"""
        try:
            if self.is_simulator:
                return True
            else:
                return self.backend.status().operational
        except:
            return False
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        try:
            if self.is_simulator:
                return {
                    "name": "Aer Simulator",
                    "type": "simulator",
                    "status": "available",
                    "qubits": "unlimited"
                }
            else:
                config = self.backend.configuration()
                return {
                    "name": config.backend_name,
                    "type": "quantum_processor",
                    "status": str(self.backend.status().status_msg),
                    "provider": "IBM Quantum",
                    "qubits": config.n_qubits
                }
        except:
            return {"name": "Unknown", "type": "unknown", "status": "error"}

class QuantumBackendManager:
    """Manages multiple quantum backends"""
    
    def __init__(self):
        self.backends: Dict[str, QuantumBackend] = {}
        self.active_backend = None
        self.executor = ThreadPoolExecutor(max_workers=3)
        
    def add_braket_backend(self, name: str, device_arn: Optional[str] = None, s3_bucket: Optional[str] = None):
        """Add AWS Braket backend"""
        if not BRAKET_AVAILABLE:
            logger.warning("Braket not available, skipping")
            return
        
        try:
            backend = BraketBackend(device_arn, s3_bucket)
            self.backends[name] = backend
            logger.info(f"Added Braket backend: {name}")
        except Exception as e:
            logger.error(f"Failed to add Braket backend {name}: {e}")
    
    def add_qiskit_backend(self, name: str, backend_name: str = "aer_simulator", token: Optional[str] = None):
        """Add Qiskit backend"""
        if not QISKIT_AVAILABLE:
            logger.warning("Qiskit not available, skipping")
            return
        
        try:
            backend = QiskitBackend(backend_name, token)
            self.backends[name] = backend
            logger.info(f"Added Qiskit backend: {name}")
        except Exception as e:
            logger.error(f"Failed to add Qiskit backend {name}: {e}")
    
    def set_active_backend(self, name: str):
        """Set the active backend"""
        if name in self.backends:
            self.active_backend = self.backends[name]
            logger.info(f"Set active backend: {name}")
        else:
            logger.error(f"Backend {name} not found")
    
    def get_available_backends(self) -> List[Dict]:
        """Get list of available backends"""
        available = []
        for name, backend in self.backends.items():
            if backend.is_available():
                info = backend.get_device_info()
                info['backend_name'] = name
                available.append(info)
        return available
    
    def execute_quantum_vqe(self, params: np.ndarray, shots: int = 1000) -> QuantumResult:
        """Execute VQE on active backend"""
        if not self.active_backend:
            logger.error("No active backend set")
            raise ValueError("No active backend configured")
        
        return self.active_backend.execute_vqe_step(params, shots)
    
    async def execute_quantum_vqe_async(self, params: np.ndarray, shots: int = 1000) -> QuantumResult:
        """Execute VQE asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self.execute_quantum_vqe, params, shots)

# Global backend manager instance
quantum_manager = QuantumBackendManager()

# Initialize default backends
def initialize_quantum_backends():
    """Initialize available quantum backends"""
    
    # Add local simulators
    quantum_manager.add_braket_backend("braket_local", None)
    quantum_manager.add_qiskit_backend("qiskit_aer", "aer_simulator")
    
    # Add AWS Braket quantum devices (if credentials available)
    braket_devices = {
        "ionq_aria": "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1",
        "ionq_forte": "arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1",
        "rigetti_aspen": "arn:aws:braket:us-west-1::device/qpu/rigetti/Aspen-M-3",
        "iqm_garnet": "arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet",
    }
    
    for name, arn in braket_devices.items():
        quantum_manager.add_braket_backend(name, arn)
    
    # Set default backend
    available = quantum_manager.get_available_backends()
    if available:
        quantum_manager.set_active_backend(available[0]['backend_name'])
        logger.info(f"Initialized {len(available)} quantum backends")
    else:
        logger.warning("No quantum backends available")

# Initialize on import
initialize_quantum_backends() 