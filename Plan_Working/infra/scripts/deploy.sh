#!/bin/bash
set -e

# Build the client application
echo "Building the client application..."
npm --prefix client run build

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting