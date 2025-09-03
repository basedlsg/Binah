from google.cloud import aiplatform

# Configuration
GCP_PROJECT = "seven-l-prod"
GCP_REGION = "us-central1"
PIPELINE_ROOT = "gs://7l-data/pipeline-roots"
PIPELINE_SPEC_PATH = "data_gen_pipeline.json"

aiplatform.init(project=GCP_PROJECT, location=GCP_REGION)

job = aiplatform.PipelineJob(
    display_name="data_generation_pipeline",
    job_id="data-gen-pipeline-2025",
    template_path=PIPELINE_SPEC_PATH,
    pipeline_root=PIPELINE_ROOT,
)

job.submit()