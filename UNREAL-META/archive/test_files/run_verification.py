# run_verification.py
import sys
import asyncio
from pathlib import Path

# Add the project root to the path to allow the import below
project_root = Path(__file__).parent.resolve()
sys.path.insert(0, str(project_root))

try:
    from verification_test import main as verification_main
except ImportError as e:
    print("Failed to import verification script.")
    print("Please ensure 'verification_test.py' is in the same directory.")
    print(f"Original error: {e}")
    sys.exit(1)

if __name__ == "__main__":
    print("Starting RAG pipeline verification via external runner...")
    asyncio.run(verification_main())
    print("Verification complete.") 