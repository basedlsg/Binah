#!/bin/bash

# 7L-Worlds Infrastructure Setup Script
# This script replaces the complex Terraform setup with simple gcloud commands

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-seven-l-prod}"
REGION="${REGION:-us-central1}"
BUCKET_LOCATION="${BUCKET_LOCATION:-US-CENTRAL1}"

echo "Setting up 7L-Worlds infrastructure for project: $PROJECT_ID"
echo "Region: $REGION"
echo "Bucket Location: $BUCKET_LOCATION"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists gcloud; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

if ! command_exists docker; then
    echo "Error: Docker is not installed. Please install it first."
    exit 1
fi

# Authenticate if not already done
echo "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Please authenticate with gcloud:"
    gcloud auth login
fi

# Set project
echo "Setting gcloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    bigquery.googleapis.com \
    pubsub.googleapis.com \
    eventarc.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

# Create GCS buckets
echo "Creating GCS buckets..."
gcloud storage buckets create gs://7l-data \
    --project=$PROJECT_ID \
    --location=$BUCKET_LOCATION \
    --uniform-bucket-level-access

gcloud storage buckets create gs://7l-models \
    --project=$PROJECT_ID \
    --location=$BUCKET_LOCATION \
    --uniform-bucket-level-access

# Create service accounts
echo "Creating service accounts..."

# Pipeline service account (for Vertex AI operations and Cloud Run services)
gcloud iam service-accounts create pipeline-sa \
    --description="Vertex AI Pipeline and Cloud Run Services Account" \
    --display-name="Pipeline SA" \
    --project=$PROJECT_ID

# GPU services service account (separate for GPU-specific permissions)
gcloud iam service-accounts create gpu-services-sa \
    --description="GPU-based Cloud Run Services Account" \
    --display-name="GPU Services SA" \
    --project=$PROJECT_ID

# Grant basic roles
echo "Granting IAM roles..."

# Pipeline SA - Vertex AI, Cloud Run, and Storage access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pipeline-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pipeline-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pipeline-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# GPU Services SA - Cloud Run and Storage access for GPU services
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:gpu-services-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:gpu-services-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create Artifact Registry repositories
echo "Creating Artifact Registry repositories..."
gcloud artifacts repositories create gen \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID

gcloud artifacts repositories create render \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID

gcloud artifacts repositories create processor \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID

gcloud artifacts repositories create train \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "Service Accounts Created:"
echo "  - pipeline-sa@$PROJECT_ID.iam.gserviceaccount.com (Vertex AI + CPU Cloud Run services)"
echo "  - gpu-services-sa@$PROJECT_ID.iam.gserviceaccount.com (GPU Cloud Run services)"
echo ""
echo "Buckets Created:"
echo "  - gs://7l-data (all data, renders, training samples)"
echo "  - gs://7l-models (trained models and artifacts)"
echo ""
echo "Artifact Registries Created:"
echo "  - gen, render, processor, train repositories in $REGION"
echo ""
echo "Next steps:"
echo "1. Build and deploy services: ./deploy.sh"
echo "2. Test data generation pipeline"
echo "3. Run training pipeline"
