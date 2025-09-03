from google.cloud import aiplatform

# Configuration
GCP_PROJECT = "seven-l-prod"
GCP_REGION = "us-central1"
GCS_BUCKET = "gs://7l-data"
TRAINER_IMAGE_URI = f"us-central1-docker.pkg.dev/{GCP_PROJECT}/train/train-7l:latest"
PROCESSOR_URL = "https://processor-502853342513.us-central1.run.app" # This would be the URL of the deployed processor service

aiplatform.init(project=GCP_PROJECT, location=GCP_REGION, staging_bucket=GCS_BUCKET)

job = aiplatform.CustomContainerTrainingJob(
    display_name="7L-Training-Job",
    container_uri=TRAINER_IMAGE_URI,
    model_serving_container_image_uri="gcr.io/deeplearning-platform-release/pytorch-gpu.1-13",
)

job.run(
    dataset=aiplatform.TabularDataset.create(
        display_name="7l-data",
        gcs_source=[f"{GCS_BUCKET}/training/train.jsonl"],
    ),
    model_display_name="7l-vlm-baseline",
    args=[
        "--epochs=3",
        "--learning_rate=2e-5",
        f"--processor_service_url={PROCESSOR_URL}",
    ],
    replica_count=1,
    machine_type="n1-standard-8",
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
)