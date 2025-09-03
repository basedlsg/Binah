#!/usr/bin/env python3
"""
End-to-End Test Script for 7L-Worlds ML Pipeline

This script demonstrates the complete ML pipeline workflow:
1. Generate 3D world using Generator service
2. Render multi-view images using Renderer service
3. Label scene with scene graph and constraints using Processor service
4. Create training data by aggregating all components

Usage: python3 test_pipeline_e2e.py
"""

import requests
import json
import time
from typing import Dict, List, Any

# Service URLs
GENERATOR_URL = "https://gen-hunyuanworld-502853342513.us-central1.run.app"
RENDERER_URL = "https://render-multiview-502853342513.us-central1.run.app"
PROCESSOR_URL = "https://processor-502853342513.us-central1.run.app"

def test_service_health(service_name: str, url: str) -> bool:
    """Test if a service is healthy."""
    try:
        response = requests.get(f"{url}/health", timeout=30)
        if response.status_code == 200:
            print(f"✅ {service_name} is healthy: {response.json()}")
            return True
        else:
            print(f"❌ {service_name} health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {service_name} health check error: {e}")
        return False

def generate_world(prompt: str) -> Dict[str, Any]:
    """Generate a 3D world using the Generator service."""
    print(f"\n🏗️  Generating 3D world with prompt: '{prompt}'")

    payload = {
        "prompt": prompt,
        "seed": 42
    }

    try:
        response = requests.post(f"{GENERATOR_URL}/generate", json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"✅ World generated successfully!")
        print(f"   World ID: {result['world_id']}")
        print(f"   Panorama: {result['panorama_uri']}")
        print(f"   Meshes: {result['meshes_uri']}")
        return result
    except Exception as e:
        print(f"❌ World generation failed: {e}")
        raise

def render_world(world_uri: str, n_views: int = 5) -> Dict[str, Any]:
    """Render multi-view images using the Renderer service."""
    print(f"\n🎨 Rendering {n_views} views of the world")

    payload = {
        "world_uri": world_uri,
        "n_views": n_views
    }

    try:
        response = requests.post(f"{RENDERER_URL}/render", json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"✅ Rendering completed successfully!")
        print(f"   Generated {len(result['image_uris'])} images")
        print(f"   Cameras file: {result['cameras_uri']}")
        return result
    except Exception as e:
        print(f"❌ Rendering failed: {e}")
        raise

def label_world(world_uri: str) -> Dict[str, Any]:
    """Label the world with scene graph and constraints using Processor service."""
    print("\n🏷️  Labeling world with scene graph and constraints")
    payload = {
        "world_uri": world_uri
    }

    try:
        response = requests.post(f"{PROCESSOR_URL}/label", json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()
        print(f"✅ World labeled successfully!")
        print(f"   Scene graph: {result['scene_graph_uri']}")
        print(f"   Constraints: {result['constraints_uri']}")
        return result
    except Exception as e:
        print(f"❌ Labeling failed: {e}")
        raise

def create_training_data(world_id: str, scene_graph_uri: str, constraints_uri: str, image_uris: List[str]) -> Dict[str, Any]:
    """Create training data by aggregating all components."""
    print("\n📚 Creating training data entry")
    training_entry = {
        "world_id": world_id,
        "scene_graph": scene_graph_uri,
        "constraints": constraints_uri,
        "images": image_uris,
        "timestamp": int(time.time())
    }

    print("✅ Training data entry created:")
    print(json.dumps(training_entry, indent=2))
    return training_entry

def main():
    """Run the complete end-to-end pipeline test."""
    print("🚀 Starting 7L-Worlds ML Pipeline End-to-End Test")
    print("=" * 60)

    # Test service health
    print("\n🏥 Testing service health...")
    services_healthy = True
    services_healthy &= test_service_health("Generator", GENERATOR_URL)
    services_healthy &= test_service_health("Renderer", RENDERER_URL)
    services_healthy &= test_service_health("Processor", PROCESSOR_URL)

    if not services_healthy:
        print("\n❌ Some services are not healthy. Aborting test.")
        return False

    # Generate world
    prompt = "a cozy living room with a sofa, coffee table, and bookshelf"
    try:
        world_data = generate_world(prompt)
        world_id = world_data["world_id"]
        meshes_uri = world_data["meshes_uri"]

        # Render world
        render_data = render_world(meshes_uri, n_views=3)
        image_uris = render_data["image_uris"]

        # Label world
        label_data = label_world(meshes_uri)
        scene_graph_uri = label_data["scene_graph_uri"]
        constraints_uri = label_data["constraints_uri"]

        # Create training data
        training_data = create_training_data(
            world_id, scene_graph_uri, constraints_uri, image_uris
        )

        print("\n🎉 Pipeline completed successfully!")
        print("=" * 60)
        print("📊 Summary:")
        print(f"   • Generated world: {world_id}")
        print(f"   • Rendered {len(image_uris)} images")
        print(f"   • Created scene graph and constraints")
        print(f"   • Ready for training data aggregation")

        return True

    except Exception as e:
        print(f"\n❌ Pipeline test failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
