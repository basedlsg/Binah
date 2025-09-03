from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import component
from google_cloud_pipeline_components.v1.custom_job import CustomContainerTrainingJobRunOp

# Configuration
GCP_PROJECT = "seven-l-prod"
GCP_REGION = "us-central1"
GCS_BUCKET = "gs://7l-data"
TRAINER_IMAGE_URI = f"us-docker.pkg.dev/{GCP_PROJECT}/train/train-7l:latest"
PROCESSOR_URL = "https://processor-502853342513.us-central1.run.app" # This would be the URL of the deployed processor service

@component
def prepare_data_for_training(
    raw_data_uri: str,
    prepared_data_dir: dsl.Output[dsl.Artifact],
):
    # This component would handle any final data transformations,
    # splitting, and formatting required by the training script.
    print(f"Preparing data from: {raw_data_uri}")
    # For now, we just pass the URI through
    prepared_data_dir.uri = raw_data_uri

@dsl.pipeline(
    name="7l-training-evaluation-pipeline",
    description="Trains, evaluates, and registers a 7L model.",
    pipeline_root=f"{GCS_BUCKET}/pipeline-roots",
)
def train_eval_pipeline(
    raw_data_uri: str = "gs://7l-data/training/train.jsonl",
    model_display_name: str = "7l-vlm-baseline",
    epochs: int = 3,
    learning_rate: float = 2e-5,
):
    prepare_data_task = prepare_data_for_training(raw_data_uri=raw_data_uri)

    # Define the Vertex AI Custom Training Job
    custom_job_task = CustomContainerTrainingJobRunOp(
        project=GCP_PROJECT,
        location=GCP_REGION,
        display_name="7L-Training-Job",
        container_uri=TRAINER_IMAGE_URI,
        model_serving_container_image_uri="gcr.io/deeplearning-platform-release/pytorch-gpu.1-13", # Example serving image
        staging_bucket=f"{GCS_BUCKET}/staging",
        training_fraction_split=0.8,
        validation_fraction_split=0.1,
        test_fraction_split=0.1,
        dataset=prepare_data_task.outputs["prepared_data_dir"],
        model_display_name=model_display_name,
        # Pass hyperparameters to the training script
        args=[
            f"--epochs={epochs}",
            f"--learning_rate={learning_rate}",
            f"--processor_service_url={PROCESSOR_URL}", # For verification-augmented loss
        ],
        # Specify machine type and accelerators
        machine_type="n1-standard-8",
        accelerator_type="NVIDIA_TESLA_T4",
        accelerator_count=1,
    )

    # In a full pipeline, you would add evaluation and deployment steps here,
    # likely conditioned on the performance of the trained model.

if __name__ == "__main__":
    compiler.Compiler().compile(
        pipeline_func=train_eval_pipeline,
        package_path="train_eval_pipeline.json",
    )