#!/bin/bash

# Script to run a demo of the Quest Dev Copilot

# --- Configuration ---
MAX_BACKEND_START_RETRIES=6 # Total wait time: MAX_RETRIES * (SLEEP_DURATION + CURL_TIMEOUT) approx
BACKEND_START_SLEEP=5     # Seconds to sleep between readiness checks
CURL_TIMEOUT=5            # Seconds for curl connection timeout
DEFAULT_PORT="5000"         # Should match backend/app.py and .env if overridden

# --- Helper Functions ---
cleanup() {
    echo "\nPerforming cleanup..."
    if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        wait $BACKEND_PID 2>/dev/null # Wait for it to actually terminate
        echo "Backend server stopped."
    else
        echo "Backend server not running or PID unknown."
    fi
    if command -v deactivate &> /dev/null && [[ "$VIRTUAL_ENV_ACTIVATED_BY_SCRIPT" == "true" ]]; then
        echo "Deactivating virtual environment..."
        deactivate
    fi
    echo "Cleanup complete."
}

# Trap EXIT signal to ensure cleanup runs
trap cleanup EXIT

# --- Script Main Logic ---
echo "-------------------------------------"
echo "  Quest Dev Copilot - Demo Runner  "
echo "-------------------------------------"

# Determine Project Root based on script location
SCRIPT_ABSPATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
SCRIPT_DIR="$(dirname "$SCRIPT_ABSPATH")"

# Intelligent Project Root Detection
if [[ "$(basename "$SCRIPT_DIR")" == "quest-dev-copilot" ]]; then
    PROJECT_ROOT="$SCRIPT_DIR"
elif [[ -f "$SCRIPT_DIR/quest-dev-copilot/requirements.txt" ]]; then # Script is in a dir containing quest-dev-copilot
    PROJECT_ROOT="$SCRIPT_DIR/quest-dev-copilot"
elif [[ -f "$SCRIPT_DIR/../requirements.txt" && "$(basename "$(dirname "$SCRIPT_DIR")")" == "quest-dev-copilot" ]]; then # Script is in a subdir of quest-dev-copilot
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
else
    PROJECT_ROOT="$PWD" # Fallback: Assume current directory is project root
fi

cd "$PROJECT_ROOT"
echo "Running demo from project root: $(pwd)"


# 1. Check for .env file
echo "\n[Step 1/5] Checking for .env configuration file..."
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found in project root ($(pwd))."
    echo "Please copy .env.example to .env and populate it with your API keys and configurations."
    exit 1
fi
set -o allexport
source .env # Source .env to make variables like PORT available
set +o allexport
BACKEND_PORT=${PORT:-$DEFAULT_PORT} 
BACKEND_URL_BASE="http://localhost:${BACKEND_PORT}"
echo ".env file found. Will target backend at $BACKEND_URL_BASE"

# 2. Activate Python virtual environment
echo "\n[Step 2/5] Activating Python virtual environment..."
if [ -d "venv" ]; then 
    echo "Activating virtual environment from ./venv ..."
    source venv/bin/activate
    VIRTUAL_ENV_ACTIVATED_BY_SCRIPT="true"
elif [ -d "backend/venv" ]; then 
    echo "Activating virtual environment from ./backend/venv ..."
    source backend/venv/bin/activate
    VIRTUAL_ENV_ACTIVATED_BY_SCRIPT="true"
else
    echo "[WARNING] No virtual environment found at ./venv or ./backend/venv. Assuming dependencies are globally available."
fi

# 3. Install/update dependencies
echo "\n[Step 3/5] Ensuring Python dependencies are installed/updated..."
if pip install -r requirements.txt; then
    echo "Dependencies checked/installed successfully."
else
    echo "[ERROR] Failed to install Python dependencies from requirements.txt."; exit 1
fi

# 4. Start backend server
echo "\n[Step 4/5] Starting backend server..."
cd backend
python app.py &
BACKEND_PID=$!
cd .. 

echo "Backend server started with PID: $BACKEND_PID. Waiting for it to become ready..."
sleep 8 # Adjusted sleep for Flask startup

# 5. Check backend readiness and run CLI demo
READY_CHECK_URL="${BACKEND_URL_BASE}/ready"
RETRY_COUNT=0
BACKEND_IS_READY=false

while [ $RETRY_COUNT -lt $MAX_BACKEND_START_RETRIES ]; do
    echo "Checking backend readiness (attempt $((RETRY_COUNT+1))/$MAX_BACKEND_START_RETRIES)... $READY_CHECK_URL"
    HTTP_RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $CURL_TIMEOUT -L $READY_CHECK_URL)
    
    if [ "$HTTP_RESPONSE_CODE" = "200" ]; then
        echo "[SUCCESS] Backend is ready! (HTTP 200)"
        curl -s $READY_CHECK_URL | (jq . || cat) # Try to pretty print with jq, fallback to cat
        BACKEND_IS_READY=true; break
    elif [ "$HTTP_RESPONSE_CODE" = "503" ]; then
        echo "[INFO] Backend is alive but reports not fully ready (HTTP 503). Proceeding with demo..."
        curl -s $READY_CHECK_URL | (jq . || cat)
        BACKEND_IS_READY=true; break
    else
        echo "[INFO] Backend not ready yet (HTTP Code: $HTTP_RESPONSE_CODE). Retrying in $BACKEND_START_SLEEP seconds..."
        sleep $BACKEND_START_SLEEP
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$BACKEND_IS_READY" = false ]; then
    echo "[ERROR] Backend server did not become ready after $MAX_BACKEND_START_RETRIES attempts."; exit 1
fi

echo "\n[Step 5/5] Running CLI demo commands..."
CLI_SCRIPT="cli/quest_fix.py"
# Sample logs are expected to be in scraper/scraped_data_output/sample_logs relative to PROJECT_ROOT
SAMPLE_LOGS_DIR_RELATIVE_TO_PROJECT_ROOT="scraper/scraped_data_output/sample_logs"

if [ ! -f "$CLI_SCRIPT" ]; then echo "[ERROR] CLI script not found: $PROJECT_ROOT/$CLI_SCRIPT"; exit 1; fi
chmod +x "$CLI_SCRIPT"

DEMO_LOGS=("plugin_conflict_sample.log" "sdk_mismatch_sample.log")

for log_name in "${DEMO_LOGS[@]}"; do
    SAMPLE_LOG_PATH="$PROJECT_ROOT/$SAMPLE_LOGS_DIR_RELATIVE_TO_PROJECT_ROOT/$log_name"
    echo "\n---------------------------------------------------------"
    echo "Running demo with: $SAMPLE_LOG_PATH"
    echo "---------------------------------------------------------"
    if [ -f "$SAMPLE_LOG_PATH" ]; then
        # To force demo mode for this specific call via backend, ensure DEMO_MODE env var is set when starting backend,
        # or enhance CLI to send {"use_demo": true} in payload and backend/app.py to check for it.
        "$PROJECT_ROOT/$CLI_SCRIPT" "$SAMPLE_LOG_PATH"
    else
        echo "[WARNING] Sample log '$SAMPLE_LOG_PATH' not found."
        echo "Please ensure you have run 'python scraper/forum_scraper.py' (after cd scraper) to generate sample logs."
        ALT_SAMPLE=$(find "$PROJECT_ROOT/$SAMPLE_LOGS_DIR_RELATIVE_TO_PROJECT_ROOT" -name '*.log' -print -quit 2>/dev/null)
        if [ -n "$ALT_SAMPLE" ]; then
            echo "Attempting with first available sample log: $ALT_SAMPLE"
            "$PROJECT_ROOT/$CLI_SCRIPT" "$ALT_SAMPLE"
        else echo "[ERROR] No sample logs found in $PROJECT_ROOT/$SAMPLE_LOGS_DIR_RELATIVE_TO_PROJECT_ROOT. Cannot run CLI demo."; fi
    fi
done

echo "\nDemo CLI commands finished."
exit 0 # Trap will handle cleanup 