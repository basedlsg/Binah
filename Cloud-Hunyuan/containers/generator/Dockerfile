# Use a base image with CUDA support for HunyuanWorld
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

# Set up the working directory
WORKDIR /app

# Install Python and other system dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy application code and requirements
COPY app/ /app/
COPY ./requirements.txt /app/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}"]