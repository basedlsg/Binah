from kfp.v2 import dsl
from kfp.v2.dsl import component
from typing import NamedTuple

@component(
    packages_to_install=["google-cloud-storage"],
)
def create_training_data_component(
    world_id: str,
    gcs_bucket: str,
) -> NamedTuple("Outputs", [("training_data_uri", str)]):
    """
    Aggregates scene graph, constraints, and rendered images into a single
    training data file in JSONL format.
    """
    import json
    from google.cloud import storage

    storage_client = storage.Client()
    bucket = storage_client.bucket(gcs_bucket)

    # Download scene graph and constraints
    scene_graph_blob = bucket.blob(f"worlds/{world_id}/scene_graph.json")
    scene_graph = json.loads(scene_graph_blob.download_as_string())

    constraints_blob = bucket.blob(f"worlds/{world_id}/constraints.json")
    constraints = json.loads(constraints_blob.download_as_string())

    # List rendered images
    image_blobs = storage_client.list_blobs(
        gcs_bucket, prefix=f"renders/{world_id}/"
    )
    image_uris = [f"gs://{gcs_bucket}/{blob.name}" for blob in image_blobs]

    # Create the training data entry
    training_entry = {
        "world_id": world_id,
        "scene_graph": scene_graph,
        "constraints": constraints,
        "image_uris": image_uris,
    }

    # Upload as a JSONL file
    training_data_blob = bucket.blob(f"training/{world_id}.jsonl")
    training_data_blob.upload_from_string(
        json.dumps(training_entry) + "\n", content_type="application/jsonl"
    )

    training_data_uri = f"gs://{gcs_bucket}/training/{world_id}.jsonl"
    return (training_data_uri,)