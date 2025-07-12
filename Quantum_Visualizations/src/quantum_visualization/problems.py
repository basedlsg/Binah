import logging
from qiskit_nature.second_q.drivers import PySCFDriver
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit.quantum_info import SparsePauliOp

logger = logging.getLogger(__name__)

def get_h2_hamiltonian(bond_distance: float = 0.735) -> SparsePauliOp:
    """
    Constructs the electronic structure Hamiltonian for a hydrogen molecule (H2).

    This function uses the PySCF driver to perform a classical Hartree-Fock
    calculation to obtain the one- and two-body integrals that describe the
    molecule's electronic interactions. These are then mapped to a qubit
    Hamiltonian using the Jordan-Wigner transformation.

    Args:
        bond_distance: The inter-atomic distance in Angstroms. 
                       The default (0.735) is the equilibrium distance.

    Returns:
        The qubit Hamiltonian as a SparsePauliOp, which can be used in
        VQE algorithms.
    """
    logger.info(f"Constructing H2 Hamiltonian for bond distance: {bond_distance} Å")
    
    try:
        # Define the molecule using a format compatible with PySCF
        # Format: 'Atom1 x1 y1 z1; Atom2 x2 y2 z2'
        molecule_spec = f"H 0 0 0; H 0 0 {bond_distance}"

        # Use PySCF to perform the classical chemistry calculation
        driver = PySCFDriver(atom=molecule_spec, basis="sto3g")
        problem = driver.run()

        # Get the electronic structure Hamiltonian
        hamiltonian = problem.hamiltonian
        
        # The second-quantized operators from the problem
        second_q_op = hamiltonian.second_q_op()

        # Map the fermionic Hamiltonian to a qubit Hamiltonian
        # The Jordan-Wigner mapping is a standard choice for this
        mapper = JordanWignerMapper()
        qubit_op = mapper.map(second_q_op)
        
        logger.info("Successfully constructed H2 qubit Hamiltonian.")
        return qubit_op

    except ImportError as e:
        logger.error(f"PySCF not found, which is required for H2 calculation. Please install it: pip install pyscf")
        raise e
    except Exception as e:
        logger.error(f"An error occurred during Hamiltonian construction: {e}")
        raise

# For direct testing of this module
if __name__ == '__main__':
    hamiltonian = get_h2_hamiltonian()
    print("H2 Qubit Hamiltonian:")
    print(hamiltonian)
    print(f"\nNumber of qubits required: {hamiltonian.num_qubits}") 