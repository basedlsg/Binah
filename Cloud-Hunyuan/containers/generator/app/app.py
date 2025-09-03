from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import subprocess
import uuid
from google.cloud import storage

app = FastAPI()

# Configuration
GCS_BUCKET_NAME = "7l-data"
storage_client = storage.Client()

class GenerationRequest(BaseModel):
    prompt: str
    seed: int | None = None
    guidance: float | None = None

class GenerationResponse(BaseModel):
    world_id: str
    panorama_uri: str
    meshes_uri: str
    object_layers_uri: str

def run_script(command: list[str]):
    """Runs a command as a subprocess and handles errors."""
    try:
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        return process.stdout
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Script execution failed: {e.stderr}")

def upload_to_gcs(source_file_name: str, destination_blob_name: str):
    """Uploads a file to the GCS bucket."""
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)
    return f"gs://{GCS_BUCKET_NAME}/{destination_blob_name}"


@app.post("/generate", response_model=GenerationResponse)
async def generate_world(request: GenerationRequest):
    """
    Accepts a prompt and triggers the HunyuanWorld generation process.
    Returns GCS URIs for the generated assets.
    """
    world_id = f"world_{uuid.uuid4()}"
    local_output_dir = f"/tmp/{world_id}"
    os.makedirs(local_output_dir, exist_ok=True)

    # --- Placeholder for HunyuanWorld Integration ---
    # 1. Run panorama generation script
    # pano_script_command = [
    #     "python", "demo_panogen.py",
    #     "--prompt", request.prompt,
    #     "--output_path", f"{local_output_dir}/panorama.jpg"
    # ]
    # run_script(pano_script_command)

    # 2. Run scene generation script using the panorama
    # scene_script_command = [
    #     "python", "demo_scenegen.py",
    #     "--input_pano", f"{local_output_dir}/panorama.jpg",
    #     "--output_dir", local_output_dir
    # ]
    # run_script(scene_script_command)
    # --- End Placeholder ---

    # For this stub, create dummy output files
    with open(f"{local_output_dir}/panorama.jpg", "w") as f: f.write("pano_data")
    with open(f"{local_output_dir}/meshes.glb", "w") as f: f.write("mesh_data")
    os.makedirs(f"{local_output_dir}/objects", exist_ok=True)
    with open(f"{local_output_dir}/objects/obj1.glb", "w") as f: f.write("obj1_data")


    # Upload generated assets to GCS
    panorama_uri = upload_to_gcs(f"{local_output_dir}/panorama.jpg", f"worlds/{world_id}/panorama.jpg")
    meshes_uri = upload_to_gcs(f"{local_output_dir}/meshes.glb", f"worlds/{world_id}/meshes.glb")

    # In a real scenario, you would loop through all object files
    upload_to_gcs(f"{local_output_dir}/objects/obj1.glb", f"worlds/{world_id}/objects/obj1.glb")
    object_layers_uri = f"gs://{GCS_BUCKET_NAME}/worlds/{world_id}/objects/"

    return GenerationResponse(
        world_id=world_id,
        panorama_uri=panorama_uri,
        meshes_uri=meshes_uri,
        object_layers_uri=object_layers_uri
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}