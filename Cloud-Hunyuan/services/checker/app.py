from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any
import json
from google.cloud import storage
# from z3 import Solver, sat # Uncomment when implementing the actual logic

app = FastAPI()

# Configuration
GCS_BUCKET_NAME = "7l-data"
storage_client = storage.Client()

class CheckRequest(BaseModel):
    program: str
    scene_graph_uri: str

class CheckResponse(BaseModel):
    passed: bool
    violations: list[str]
    counterexample: dict[str, Any] | None = None

def download_from_gcs(source_blob_name: str, destination_file_name: str):
    """Downloads a file from the GCS bucket."""
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)

@app.post("/check", response_model=CheckResponse)
async def check_program(request: CheckRequest):
    """
    Accepts a symbolic program and a scene graph, and checks for violations.
    Returns pass/fail, a list of violations, and a potential counterexample.
    """
    world_id = request.scene_graph_uri.split('/')[-2]
    local_sg_path = f"/tmp/{world_id}_scene_graph.json"

    # Download scene graph from GCS
    sg_blob_name = f"worlds/{world_id}/scene_graph.json"
    download_from_gcs(sg_blob_name, local_sg_path)

    with open(local_sg_path, "r") as f:
        scene_graph = json.load(f)

    # --- Placeholder for Z3/Scallop Integration ---
    # s = Solver()
    # # 1. Translate scene_graph into Z3 assertions
    # # 2. Translate request.program into Z3 assertions
    # # 3. s.check() and analyze the model for counterexamples
    # result = s.check()
    # passed = result == sat
    # --- End Placeholder ---

    # For this stub, implement simple logic
    passed = "error" not in request.program.lower()
    violations = [] if passed else ["Detected 'error' in program string."]
    counterexample = None if passed else {"details": "Program contained 'error'"}


    return CheckResponse(
        passed=passed,
        violations=violations,
        counterexample=counterexample
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}