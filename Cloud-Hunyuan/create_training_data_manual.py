#!/usr/bin/env python3
"""
Manually create training data from existing worlds and renders
"""

import sys
import os
sys.path.append('pipelines')

from google.cloud import storage
import json
import uuid

def create_training_data_for_world(world_id: str, gcs_bucket: str = "7l-data"):
    """Create training data for a specific world"""

    print(f"📚 Creating training data for world: {world_id}")

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(gcs_bucket)

        # Download scene graph and constraints
        scene_graph_blob = bucket.blob(f"worlds/{world_id}/scene_graph.json")
        scene_graph = json.loads(scene_graph_blob.download_as_string())
        print("  ✅ Downloaded scene graph")

        constraints_blob = bucket.blob(f"worlds/{world_id}/constraints.json")
        constraints = json.loads(constraints_blob.download_as_string())
        print("  ✅ Downloaded constraints")

        # List rendered images
        image_blobs = list(storage_client.list_blobs(
            gcs_bucket, prefix=f"renders/{world_id}/"
        ))

        image_uris = []
        for blob in image_blobs:
            if blob.name.endswith('.png'):
                image_uris.append(f"gs://{gcs_bucket}/{blob.name}")

        print(f"  ✅ Found {len(image_uris)} rendered images")

        # Create training data entry
        training_entry = {
            "world_id": world_id,
            "scene_graph": scene_graph,
            "constraints": constraints,
            "images": image_uris,
            "prompt": "Generated world for 7L training",  # Placeholder
            "timestamp": "2025-01-01T00:00:00Z"  # Placeholder
        }

        # Upload as a JSONL file
        training_data_blob = bucket.blob(f"training/{world_id}.jsonl")
        training_data_blob.upload_from_string(
            json.dumps(training_entry) + "\n",
            content_type="application/jsonl"
        )

        training_data_uri = f"gs://{gcs_bucket}/training/{world_id}.jsonl"
        print(f"  ✅ Uploaded training data to: {training_data_uri}")

        return training_data_uri

    except Exception as e:
        print(f"❌ Error creating training data: {e}")
        return None

def main():
    """Create training data for all available worlds"""

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket("7l-data")

        # Find all world directories
        world_prefixes = set()
        for blob in bucket.list_blobs(prefix="worlds/"):
            if "/" in blob.name:
                world_prefix = blob.name.split("/")[1]
                if world_prefix:
                    world_prefixes.add(world_prefix)

        print(f"🔍 Found {len(world_prefixes)} worlds to process:")
        for world_id in world_prefixes:
            print(f"  - {world_id}")

        # Create training data for each world
        created_files = []
        for world_id in world_prefixes:
            training_uri = create_training_data_for_world(world_id)
            if training_uri:
                created_files.append(training_uri)
            print()

        if created_files:
            print(f"✅ Successfully created {len(created_files)} training data files:")
            for uri in created_files:
                print(f"  - {uri}")

            # Create a combined training file
            combined_content = ""
            for uri in created_files:
                blob_name = uri.replace(f"gs://7l-data/", "")
                blob = bucket.blob(blob_name)
                combined_content += blob.download_as_string().decode('utf-8')

            combined_blob = bucket.blob("training/train.jsonl")
            combined_blob.upload_from_string(combined_content, content_type="application/jsonl")
            print(f"\n✅ Created combined training file: gs://7l-data/training/train.jsonl")

            return len(created_files)
        else:
            print("❌ No training data files were created")
            return 0

    except Exception as e:
        print(f"❌ Error in main: {e}")
        return 0

if __name__ == "__main__":
    count = main()
    if count > 0:
        print(f"\n🎉 Ready to test training pipeline with {count} training data files!")
    else:
        print("\n❌ Failed to create training data")
        sys.exit(1)
