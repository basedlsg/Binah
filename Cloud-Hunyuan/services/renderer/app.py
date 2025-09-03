from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import subprocess
import json
import logging
from google.cloud import storage

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration
GCS_DATA_BUCKET = "7l-data"

# Initialize storage client with error handling
try:
    storage_client = storage.Client()
    logger.info("Successfully initialized GCS client")
except Exception as e:
    logger.error(f"Failed to initialize GCS client: {e}")
    storage_client = None

class RenderRequest(BaseModel):
    world_uri: str
    n_views: int
    rng_seed: int | None = None

class RenderResponse(BaseModel):
    image_uris: list[str]
    cameras_uri: str

def download_from_gcs(source_blob_name: str, destination_file_name: str):
    """Downloads a file from the GCS bucket."""
    bucket = storage_client.bucket(GCS_DATA_BUCKET)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)

def upload_to_gcs(source_file_name: str, destination_blob_name: str):
    """Uploads a file to the GCS bucket."""
    bucket = storage_client.bucket(GCS_DATA_BUCKET)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)
    return f"gs://{GCS_DATA_BUCKET}/{destination_blob_name}"

@app.post("/render", response_model=RenderResponse)
async def render_views(request: RenderRequest):
    """
    Accepts a GCS URI to a world and renders multiple views.
    Returns GCS URIs for the rendered images and camera parameters.
    """
    world_id = request.world_uri.split('/')[-2]
    local_world_path = f"/tmp/{world_id}_mesh.glb"
    local_output_dir = f"/tmp/{world_id}_renders"
    os.makedirs(local_output_dir, exist_ok=True)

    # Download the mesh from GCS
    mesh_blob_name = f"worlds/{world_id}/meshes.glb"
    download_from_gcs(mesh_blob_name, local_world_path)

    # --- Placeholder for PyTorch3D/Kaolin Integration ---
    # render_script_command = [
    #     "python", "render_script.py",
    #     "--input_mesh", local_world_path,
    #     "--output_dir", local_output_dir,
    #     "--n_views", str(request.n_views)
    # ]
    # subprocess.run(render_script_command, check=True)
    # --- End Placeholder ---

    # For this stub, create dummy output files
    image_uris = []
    for i in range(request.n_views):
        dummy_image_path = f"{local_output_dir}/view_{i:03d}.png"
        with open(dummy_image_path, "w") as f: f.write(f"image_data_{i}")
        gcs_path = upload_to_gcs(dummy_image_path, f"renders/{world_id}/view_{i:03d}.png")
        image_uris.append(gcs_path)

    dummy_cameras_path = f"{local_output_dir}/cameras.json"
    with open(dummy_cameras_path, "w") as f: json.dump({"camera_info": "dummy"}, f)
    cameras_uri = upload_to_gcs(dummy_cameras_path, f"renders/{world_id}/cameras.json")


    return RenderResponse(
        image_uris=image_uris,
        cameras_uri=cameras_uri
    )

@app.get("/health")
def health_check():
    logger.info("Health check called")
    return {"status": "ok", "message": "Renderer service is running"}

@app.on_event("startup")
async def startup_event():
    logger.info("Renderer service is starting up...")
    logger.info(f"PORT environment variable: {os.environ.get('PORT', '8080')}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Renderer service is shutting down...")