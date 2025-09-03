#!/bin/bash

# 7L-Worlds Service Deployment Script
# Builds and deploys all microservices to Cloud Run

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-seven-l-prod}"
REGION="${REGION:-us-central1}"

echo "Deploying 7L-Worlds services to project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Function to build and deploy a service
deploy_service() {
    local service_name=$1
    local service_account=$2
    local gpu_flag=$3
    local cpu_count=$4
    local memory=$5

    echo "Building and deploying $service_name..."

    # Build and push Docker image
    gcloud builds submit "containers/$service_name" \
        --config="containers/$service_name/cloudbuild.yaml" \
        --project=$PROJECT_ID \
        --substitutions=_REGION=$REGION

    echo "✅ $service_name deployment complete!"
    echo ""
}

# Deploy GPU services first (more expensive, deploy fewer)
echo "Deploying GPU services..."
echo "Building generator service..."
gcloud builds submit "containers/generator" \
    --config="containers/generator/cloudbuild.yaml" \
    --project=$PROJECT_ID

echo "Building renderer service..."
gcloud builds submit "containers/renderer" \
    --config="containers/renderer/cloudbuild.yaml" \
    --project=$PROJECT_ID

# Deploy CPU services
echo "Deploying CPU services..."
echo "Building processor service..."
gcloud builds submit "containers/processor" \
    --config="containers/processor/cloudbuild.yaml" \
    --project=$PROJECT_ID

# Note: Trainer service would be deployed separately as needed for training jobs
echo "Note: Trainer service should be deployed as a Vertex AI Custom Training Job when needed."
echo ""

echo "✅ All services deployed successfully!"
echo ""
echo "Service URLs (get actual URLs with the command below):"
echo "  Generator:  https://gen-hunyuanworld-*-$REGION.a.run.app"
echo "  Renderer:   https://render-multiview-*-$REGION.a.run.app"
echo "  Processor:  https://processor-*-$REGION.a.run.app"
echo ""
echo "To get the actual URLs, run:"
echo "  gcloud run services list --project=$PROJECT_ID --region=$REGION"
echo ""
echo "Then update your pipeline configurations with the actual service URLs."
