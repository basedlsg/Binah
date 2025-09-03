#!/usr/bin/env python3
"""
Setup GitHub Secrets for CI/CD Pipeline
Generates instructions for configuring GitHub repository secrets
"""

import json
import base64
import os
from pathlib import Path

def generate_github_secrets_guide():
    """Generate setup instructions for GitHub secrets"""

    print("🔐 GitHub Secrets Setup Guide")
    print("=" * 50)
    print()

    print("To enable the CI/CD pipeline, you need to configure these GitHub secrets:")
    print()

    # Check if terraform key exists
    terraform_key_path = "/Users/carlos/Cloud-Hunyuan/terraform-key.json"
    if os.path.exists(terraform_key_path):
        print("1. GCP_SA_KEY (Service Account Key)")
        print("   📁 Found terraform-key.json")
        print("   🔧 Copy the entire contents of terraform-key.json")
        print("   📝 Paste into: GitHub → Repository → Settings → Secrets and variables → Actions")
        print("   🏷️  Secret name: GCP_SA_KEY")
        print()

        # Show the key content (truncated for security)
        with open(terraform_key_path, 'r') as f:
            key_data = json.load(f)

        print("   📋 Key details:")
        print(f"   • Project: {key_data.get('project_id', 'N/A')}")
        print(f"   • Service Account: {key_data.get('client_email', 'N/A')}")
        print(f"   • Key ID: {key_data.get('private_key_id', 'N/A')[:20]}...")
        print()

    else:
        print("1. GCP_SA_KEY (Service Account Key)")
        print("   ⚠️  terraform-key.json not found")
        print("   🔧 Create a new service account key:")
        print("   ```bash")
        print("   gcloud iam service-accounts keys create terraform-key.json \\")
        print("     --iam-account=terraform@seven-l-prod.iam.gserviceaccount.com")
        print("   ```")
        print()

    print("2. Repository Configuration")
    print("   Go to: https://github.com/YOUR_USERNAME/7l-worlds/settings/secrets/actions")
    print("   Add the following secrets:")
    print()

    print("   🔑 GCP_SA_KEY")
    print("      • Type: Service Account Key JSON")
    print("      • Purpose: Authenticate with Google Cloud")
    print("      • Permissions: Deploy to Cloud Run, access GCS, Vertex AI")
    print()

    print("3. Verify CI/CD Pipeline")
    print("   After setting up secrets:")
    print("   • Push to main branch to trigger deployment")
    print("   • Check Actions tab for pipeline status")
    print("   • Monitor deployment logs")
    print()

    print("4. Troubleshooting")
    print("   If pipeline fails:")
    print("   • Check secret values are correct")
    print("   • Verify service account permissions")
    print("   • Ensure billing is enabled on GCP project")
    print("   • Check GitHub Actions logs for detailed errors")
    print()

    print("5. Manual Deployment (Alternative)")
    print("   If CI/CD has issues, you can still deploy manually:")
    print("   ```bash")
    print("   ./setup.sh")
    print("   ./deploy.sh")
    print("   ```")
    print()

    print("✅ GitHub Secrets Setup Complete!")
    print("🎯 Your CI/CD pipeline is now ready to automatically:")
    print("   • Test code changes")
    print("   • Build and deploy services")
    print("   • Generate research papers")
    print("   • Monitor system health")

if __name__ == "__main__":
    generate_github_secrets_guide()
