#!/bin/bash

# Quest Dev Copilot - Llama API Fine-Tuning with curl
# This script provides curl commands for manual fine-tuning

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if API key is set
if [ -z "$LLAMA_API_KEY" ]; then
    echo -e "${RED}❌ LLAMA_API_KEY environment variable not set${NC}"
    echo "Please set your Llama API key:"
    echo "export LLAMA_API_KEY='your-api-key-here'"
    exit 1
fi

echo -e "${BLUE}🚀 Quest Dev Copilot - Llama API Fine-Tuning${NC}"
echo "=================================================="

# Step 1: Upload Dataset
echo -e "\n${YELLOW}Step 1: Uploading Dataset${NC}"
echo "----------------------------------------"

DATASET_PATH="fine_tuned_models/comprehensive_training_data.jsonl"

if [ ! -f "$DATASET_PATH" ]; then
    echo -e "${RED}❌ Dataset not found: $DATASET_PATH${NC}"
    echo "Please run the dataset preparation script first:"
    echo "python scripts/simple_fine_tuning.py"
    exit 1
fi

echo "Uploading dataset: $DATASET_PATH"

# Upload the dataset
UPLOAD_RESPONSE=$(curl -s -X POST "https://api.llama.com/v1/files" \
    -H "Authorization: Bearer $LLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": \"$(cat $DATASET_PATH | base64 -w 0)\",
        \"purpose\": \"fine-tune\"
    }")

echo "Upload response: $UPLOAD_RESPONSE"

# Extract dataset ID
DATASET_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')

if [ "$DATASET_ID" = "null" ] || [ -z "$DATASET_ID" ]; then
    echo -e "${RED}❌ Failed to get dataset ID${NC}"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Dataset uploaded successfully: $DATASET_ID${NC}"

# Step 2: Create Fine-Tuning Job
echo -e "\n${YELLOW}Step 2: Creating Fine-Tuning Job${NC}"
echo "----------------------------------------"

JOB_NAME="quest-dev-copilot-production-$(date +%Y%m%d-%H%M%S)"

JOB_RESPONSE=$(curl -s -X POST "https://api.llama.com/v1/fine_tuning/jobs" \
    -H "Authorization: Bearer $LLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"Llama-3.3-8B-Instruct\",
        \"training_file\": \"$DATASET_ID\",
        \"hyperparameters\": {
            \"n_epochs\": 3,
            \"batch_size\": 4,
            \"learning_rate_multiplier\": 1.0
        },
        \"suffix\": \"$JOB_NAME\"
    }")

echo "Job creation response: $JOB_RESPONSE"

# Extract job ID
JOB_ID=$(echo $JOB_RESPONSE | jq -r '.id')

if [ "$JOB_ID" = "null" ] || [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Failed to get job ID${NC}"
    echo "Response: $JOB_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Fine-tuning job created: $JOB_ID${NC}"

# Step 3: Monitor Job Status
echo -e "\n${YELLOW}Step 3: Monitoring Job Status${NC}"
echo "----------------------------------------"

echo "Job ID: $JOB_ID"
echo "Job Name: $JOB_NAME"
echo "Dataset ID: $DATASET_ID"

# Save job information
cat > "fine_tuning_job_info.json" << EOF
{
    "job_id": "$JOB_ID",
    "job_name": "$JOB_NAME",
    "dataset_id": "$DATASET_ID",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "created"
}
EOF

echo -e "${GREEN}✅ Job information saved to: fine_tuning_job_info.json${NC}"

# Step 4: Provide monitoring commands
echo -e "\n${YELLOW}Step 4: Monitoring Commands${NC}"
echo "----------------------------------------"

echo -e "${BLUE}📊 Check job status:${NC}"
echo "curl -H 'Authorization: Bearer \$LLAMA_API_KEY' \\"
echo "     'https://api.llama.com/v1/fine_tuning/jobs/$JOB_ID'"

echo -e "\n${BLUE}📋 List all jobs:${NC}"
echo "curl -H 'Authorization: Bearer \$LLAMA_API_KEY' \\"
echo "     'https://api.llama.com/v1/fine_tuning/jobs'"

echo -e "\n${BLUE}❌ Cancel job (if needed):${NC}"
echo "curl -X POST -H 'Authorization: Bearer \$LLAMA_API_KEY' \\"
echo "     'https://api.llama.com/v1/fine_tuning/jobs/$JOB_ID/cancel'"

# Step 5: Test the model (when ready)
echo -e "\n${YELLOW}Step 5: Testing Fine-Tuned Model${NC}"
echo "----------------------------------------"

echo -e "${BLUE}🧪 Test model (when job completes):${NC}"
echo "curl -H 'Authorization: Bearer \$LLAMA_API_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{"
echo "       \"model\": \"<FINE_TUNED_MODEL_ID>\","
echo "       \"messages\": ["
echo "         {\"role\": \"system\", \"content\": \"You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging.\"},"
echo "         {\"role\": \"user\", \"content\": \"Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048\"}"
echo "       ],"
echo "       \"max_tokens\": 1000,"
echo "       \"temperature\": 0.1"
echo "     }' \\"
echo "     'https://api.llama.com/v1/chat/completions'"

echo -e "\n${GREEN}🎉 Fine-tuning pipeline completed!${NC}"
echo "=================================================="
echo -e "${YELLOW}⏰ The fine-tuning job will take 2-4 hours to complete.${NC}"
echo -e "${YELLOW}📊 Monitor progress using the commands above.${NC}"
echo -e "${YELLOW}📄 Job details saved to: fine_tuning_job_info.json${NC}"

# Optional: Check initial status
echo -e "\n${BLUE}🔍 Checking initial job status...${NC}"
sleep 2

STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $LLAMA_API_KEY" \
    "https://api.llama.com/v1/fine_tuning/jobs/$JOB_ID")

STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
echo -e "${GREEN}Current status: $STATUS${NC}" 