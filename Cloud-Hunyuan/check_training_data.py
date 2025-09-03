#!/usr/bin/env python3
"""
Check training data availability and prepare for training pipeline test
"""

from google.cloud import storage
import json
import sys

def check_training_data():
    """Check what training data is available in GCS"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket("7l-data")

        # List training data files
        training_blobs = list(bucket.list_blobs(prefix="training/"))

        if not training_blobs:
            print("❌ No training data found in gs://7l-data/training/")
            return None

        print(f"✅ Found {len(training_blobs)} training data files:")
        for blob in training_blobs:
            print(f"  - {blob.name} ({blob.size} bytes)")

        # Get the first training data file for inspection
        training_blob = training_blobs[0]
        content_str = training_blob.download_as_string().decode('utf-8')

        # Handle JSONL format (multiple JSON objects per line)
        if training_blob.name.endswith('.jsonl'):
            lines = content_str.strip().split('\n')
            if lines:
                try:
                    first_entry = json.loads(lines[0])
                    print(f"\n📋 Sample training data structure from {training_blob.name} (JSONL format):")
                    print(f"  - Contains {len(lines)} training entries")
                    print(f"  - First entry keys: {list(first_entry.keys())}")
                    print(f"  - World ID: {first_entry.get('world_id', 'N/A')}")
                    print(f"  - Images: {len(first_entry.get('images', []))} rendered images")
                except json.JSONDecodeError as e:
                    print(f"❌ Error parsing JSONL: {e}")
            else:
                print(f"❌ {training_blob.name} appears to be empty")
        else:
            # Single JSON object
            try:
                content = json.loads(content_str)
                print(f"\n📋 Sample training data structure from {training_blob.name}:")
                print(json.dumps(content, indent=2))
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing JSON: {e}")

        return training_blobs[0].name

    except Exception as e:
        print(f"❌ Error checking training data: {e}")
        return None

if __name__ == "__main__":
    training_file = check_training_data()
    if training_file:
        print(f"\n✅ Ready to test training pipeline with: {training_file}")
    else:
        print("\n⚠️  No training data available. Run the data generation pipeline first.")
        sys.exit(1)
