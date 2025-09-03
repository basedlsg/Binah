#!/usr/bin/env python3
"""
Check what data exists in the GCS bucket to understand pipeline status
"""

from google.cloud import storage
import json

def check_bucket_contents():
    """Check all contents of the 7l-data bucket"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket("7l-data")

        print("🔍 Checking bucket contents...")

        # Check worlds directory
        print("\n📁 Worlds directory:")
        world_blobs = list(bucket.list_blobs(prefix="worlds/"))
        if world_blobs:
            for blob in world_blobs[:5]:  # Show first 5
                print(f"  - {blob.name}")
            if len(world_blobs) > 5:
                print(f"  ... and {len(world_blobs) - 5} more")
        else:
            print("  - No worlds found")

        # Check renders directory
        print("\n🖼️  Renders directory:")
        render_blobs = list(bucket.list_blobs(prefix="renders/"))
        if render_blobs:
            for blob in render_blobs[:5]:  # Show first 5
                print(f"  - {blob.name}")
            if len(render_blobs) > 5:
                print(f"  ... and {len(render_blobs) - 5} more")
        else:
            print("  - No renders found")

        # Check training directory
        print("\n📚 Training directory:")
        training_blobs = list(bucket.list_blobs(prefix="training/"))
        if training_blobs:
            for blob in training_blobs:
                print(f"  - {blob.name}")
        else:
            print("  - No training data found")

        # Check pipeline-roots
        print("\n🔧 Pipeline roots:")
        pipeline_blobs = list(bucket.list_blobs(prefix="pipeline-roots/"))
        if pipeline_blobs:
            for blob in pipeline_blobs[:3]:  # Show first 3
                print(f"  - {blob.name}")
            if len(pipeline_blobs) > 3:
                print(f"  ... and {len(pipeline_blobs) - 3} more")
        else:
            print("  - No pipeline artifacts found")

        return {
            "worlds": len(world_blobs),
            "renders": len(render_blobs),
            "training": len(training_blobs),
            "pipeline": len(pipeline_blobs)
        }

    except Exception as e:
        print(f"❌ Error checking bucket: {e}")
        return None

if __name__ == "__main__":
    stats = check_bucket_contents()
    if stats:
        print(f"\n📊 Bucket Summary:")
        print(f"  - Worlds: {stats['worlds']}")
        print(f"  - Renders: {stats['renders']}")
        print(f"  - Training data: {stats['training']}")
        print(f"  - Pipeline artifacts: {stats['pipeline']}")

        if stats['worlds'] > 0 and stats['renders'] > 0 and stats['training'] == 0:
            print("\n⚠️  Pipeline partially completed - worlds and renders exist but no training data")
        elif stats['worlds'] == 0:
            print("\n🚀 Ready to run first data generation pipeline")
        else:
            print("\n✅ Pipeline data available")
