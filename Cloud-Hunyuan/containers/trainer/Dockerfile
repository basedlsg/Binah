# Use a base image with CUDA and PyTorch support
# Google provides pre-built deep learning containers that are optimized for Vertex AI
FROM gcr.io/deeplearning-platform-release/pytorch-gpu.1-13

# Set up the working directory
WORKDIR /app

# Copy application code and requirements
# In a real scenario, you would copy your training script here
# COPY train.py /app/
COPY containers/trainer/requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Vertex AI will run the training script, so no CMD is needed
# The entrypoint is specified in the custom job definition