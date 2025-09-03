from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
from google.cloud import storage
# import trimesh # Uncomment when implementing the actual logic

app = FastAPI()

# Configuration
GCS_BUCKET_NAME = "7l-data"
storage_client = storage.Client()

class LabelRequest(BaseModel):
    world_uri: str

class LabelResponse(BaseModel):
    scene_graph_uri: str
    constraints_uri: str

def download_from_gcs(source_blob_name: str, destination_file_name: str):
    """Downloads a file from the GCS bucket."""
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)

def upload_to_gcs(source_file_name: str, destination_blob_name: str):
    """Uploads a file to the GCS bucket."""
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)
    return f"gs://{GCS_BUCKET_NAME}/{destination_blob_name}"

@app.post("/label", response_model=LabelResponse)
async def label_scene(request: LabelRequest):
    """
    Accepts a GCS URI to a world and generates a scene graph and constraints.
    Returns GCS URIs for the generated artifacts.
    """
    world_id = request.world_uri.split('/')[-2]
    local_mesh_path = f"/tmp/{world_id}_mesh.glb"
    
    # Download the mesh from GCS
    mesh_blob_name = f"{world_id}/meshes.glb"
    download_from_gcs(mesh_blob_name, local_mesh_path)

    # --- Placeholder for Trimesh/Open3D Integration ---
    # scene = trimesh.load(local_mesh_path)
    # scene_graph = {"world_id": world_id, "objects": [], "relations": [], "cameras": []}
    # constraints = {"world_id": world_id, "format": "json-cnf", "constraints": []}
    # # ... process the scene to extract objects, relations, etc.
    # --- End Placeholder ---

    # For this stub, create dummy output files
    scene_graph_path = f"/tmp/{world_id}_scene_graph.json"
    constraints_path = f"/tmp/{world_id}_constraints.json"
    with open(scene_graph_path, "w") as f: json.dump({"scene_info": "dummy"}, f)
    with open(constraints_path, "w") as f: json.dump({"constraint_info": "dummy"}, f)

    # Upload artifacts to GCS
    scene_graph_uri = upload_to_gcs(scene_graph_path, f"worlds/{world_id}/scene_graph.json")
    constraints_uri = upload_to_gcs(constraints_path, f"worlds/{world_id}/constraints.json")

    return LabelResponse(
        scene_graph_uri=scene_graph_uri,
        constraints_uri=constraints_uri
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}