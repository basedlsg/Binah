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