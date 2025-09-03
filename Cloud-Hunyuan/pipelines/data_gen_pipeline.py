from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import component
from typing import NamedTuple
from create_training_data import create_training_data_component

# This would be dynamically retrieved, e.g., from a config file or environment variables
GENERATOR_URL = "https://gen-hunyuanworld-502853342513.us-central1.run.app"
RENDERER_URL = "https://render-multiview-502853342513.us-central1.run.app"
PROCESSOR_URL = "https://processor-502853342513.us-central1.run.app"
GCS_BUCKET = "gs://7l-data"

@component(
    packages_to_install=["requests"],
)
def generate_world_component(prompt: str) -> NamedTuple("Outputs", [("world_id", str), ("meshes_uri", str)]):
    import requests
    import logging

    logging.basicConfig(level=logging.INFO)
    logging.info(f"Generating world with prompt: '{prompt}'")
    
    # In a real pipeline, this would handle auth (e.g., via service account token)
    # response = requests.post(f"{GENERATOR_URL}/generate", json={"prompt": prompt})
    # response.raise_for_status()
    # data = response.json()
    # return (data["world_id"], data["meshes_uri"])
    
    # Placeholder response
    world_id = "w_placeholder_123"
    meshes_uri = f"gs://7l-data/worlds/{world_id}/meshes.glb"
    return (world_id, meshes_uri)

@component(packages_to_install=["requests"])
def render_views_component(meshes_uri: str, num_views: int):
    import requests
    import logging

    logging.basicConfig(level=logging.INFO)
    logging.info(f"Rendering {num_views} views for world: {meshes_uri}")
    # requests.post(f"{RENDERER_URL}/render", json={"world_uri": meshes_uri, "n_views": num_views}).raise_for_status()

@component(packages_to_install=["requests"])
def process_scene_component(meshes_uri: str):
    import requests
    import logging

    logging.basicConfig(level=logging.INFO)
    logging.info(f"Processing scene for world: {meshes_uri}")
    # Label the scene (generate scene graph and constraints)
    requests.post(f"{PROCESSOR_URL}/label", json={"world_uri": meshes_uri}).raise_for_status()

@dsl.pipeline(
    name="7l-data-generation-pipeline",
    description="Generates, renders, and labels a single world by calling Cloud Run services.",
    pipeline_root=f"{GCS_BUCKET}/pipeline-roots",
)
def data_gen_pipeline(
    prompt: str = "a red chair and a blue table in a room",
    num_views: int = 5,
):
    gen_task = generate_world_component(prompt=prompt)
    
    with dsl.Condition(gen_task.outputs["world_id"] != "failed"):
        render_task = render_views_component(
            meshes_uri=gen_task.outputs["meshes_uri"],
            num_views=num_views
        )
        process_task = process_scene_component(
            meshes_uri=gen_task.outputs["meshes_uri"]
        )
        create_training_data_task = create_training_data_component(
            world_id=gen_task.outputs["world_id"],
            gcs_bucket=GCS_BUCKET,
        )
        create_training_data_task.after(render_task, process_task)

if __name__ == "__main__":
    compiler.Compiler().compile(
        pipeline_func=data_gen_pipeline,
        package_path="data_gen_pipeline.json",
    )