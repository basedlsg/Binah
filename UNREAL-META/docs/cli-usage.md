# CLI Tool Usage Guide

## Overview

The Quest Fix CLI tool provides a command-line interface for analyzing Unreal Engine Quest build errors and applying AI-powered fixes. It's perfect for CI/CD integration, automated workflows, and developers who prefer terminal-based tools.

## Installation

### Method 1: From Source

```bash
# Clone the repository
git clone https://github.com/quest-dev-copilot/quest-dev-copilot.git
cd quest-dev-copilot

# Install dependencies
pip install -r requirements.txt

# Make CLI executable
chmod +x cli/quest_fix.py

# Add to PATH (optional)
echo 'export PATH="$PATH:$(pwd)/cli"' >> ~/.bashrc
source ~/.bashrc
```

### Method 2: Package Installation (Future)

```bash
# Install from PyPI
pip install quest-dev-copilot

# CLI will be available as 'quest-fix'
quest-fix --help
```

### Method 3: Docker

```bash
# Pull the Docker image
docker pull quest-dev-copilot/cli:latest

# Create alias for convenience
alias quest-fix='docker run --rm -v $(pwd):/workspace quest-dev-copilot/cli'

# Use normally
quest-fix /workspace/Saved/Logs/MyProject.log
```

## Quick Start

```bash
# Basic usage - analyze a log file
python cli/quest_fix.py path/to/your/logfile.log

# With automatic fix application
python cli/quest_fix.py path/to/your/logfile.log --apply-fix

# Verbose output with detailed analysis
python cli/quest_fix.py path/to/your/logfile.log --verbose

# Save results to file
python cli/quest_fix.py path/to/your/logfile.log --output analysis.json
```

## Command Reference

### Basic Syntax

```bash
quest-fix LOG_FILE [OPTIONS]
```

### Arguments

- `LOG_FILE` - Path to the Unreal Engine log file to analyze (required)

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--backend-url` | | Backend API URL | `http://localhost:5000` |
| `--apply-fix` | | Automatically apply fixes if available | `false` |
| `--output` | `-o` | Save analysis results to JSON file | None |
| `--verbose` | `-v` | Enable verbose output | `false` |
| `--timeout` | `-t` | Request timeout in seconds | `60` |
| `--format` | `-f` | Output format (json, yaml, table) | `table` |
| `--no-color` | | Disable colored output | `false` |
| `--config` | `-c` | Configuration file path | `~/.quest-copilot.toml` |
| `--dry-run` | | Show what would be fixed without applying | `false` |
| `--help` | `-h` | Show help message | |

## Usage Examples

### Basic Error Analysis

```bash
# Analyze the latest log file
python cli/quest_fix.py Saved/Logs/MyProject.log

# Output:
# 🔍 Error Classification
# ┌─────────────────┬────────────────────┐
# │ Error Type      │ plugin_conflict    │
# │ Confidence      │ 95.0%              │
# │ Auto-fixable    │ ✅ Yes             │
# └─────────────────┴────────────────────┘
# 
# 🔧 Fix Instructions
# ┌───────────────────────────────────────────────────────────┐
# │ 1. Open your .uproject file                              │
# │ 2. Locate the 'Plugins' section                          │
# │ 3. Set 'OpenXR' enabled to false                         │
# │ 4. Save and regenerate project files                     │
# └───────────────────────────────────────────────────────────┘
```

### Automatic Fix Application

```bash
# Apply fixes automatically
python cli/quest_fix.py Saved/Logs/MyProject.log --apply-fix

# Output:
# 🔧 Applying automatic fix...
# ✅ Plugin 'OpenXR' disabled in MyProject.uproject
# 💡 Remember to regenerate project files!
```

### Verbose Analysis

```bash
# Get detailed analysis information
python cli/quest_fix.py Saved/Logs/MyProject.log --verbose

# Additional output includes:
# 📊 Log file size: 15234 characters
# 🌐 Backend: http://localhost:5000
# 📊 Metrics:
#   • Tokens used: 1,250
#   • Cost: $0.0025
#   • Latency: 2,340ms
#   • Model: Llama-4-Scout-17B-16E-Instruct-FP8
```

### Save Results

```bash
# Save analysis to JSON file
python cli/quest_fix.py Saved/Logs/MyProject.log --output analysis.json

# The JSON file contains:
{
  "classification": {
    "error_type": "plugin_conflict",
    "confidence": 0.95,
    "auto_fixable": true
  },
  "fix": "Step-by-step instructions...",
  "auto_fix": {
    "action": "toggle_plugin",
    "plugin_name": "OpenXR",
    "enabled": false
  },
  "sources": [...],
  "metrics": {...}
}
```

### Different Output Formats

```bash
# JSON output
python cli/quest_fix.py logfile.log --format json

# YAML output  
python cli/quest_fix.py logfile.log --format yaml

# Table output (default)
python cli/quest_fix.py logfile.log --format table
```

### Custom Backend

```bash
# Use different backend server
python cli/quest_fix.py logfile.log --backend-url https://api.quest-copilot.com

# Use local Docker backend
python cli/quest_fix.py logfile.log --backend-url http://localhost:8000
```

## Configuration

### Configuration File

Create `~/.quest-copilot.toml` for persistent settings:

```toml
[api]
backend_url = "http://localhost:5000"
timeout = 60
retry_attempts = 3

[output]
format = "table"
verbose = false
use_color = true

[fixes]
auto_apply = false
create_backups = true
confirm_before_apply = true

[logging]
level = "INFO"
file = "~/.quest-copilot.log"
```

### Environment Variables

Set these environment variables to override defaults:

```bash
export QUEST_COPILOT_BACKEND_URL="http://localhost:5000"
export QUEST_COPILOT_TIMEOUT=60
export QUEST_COPILOT_API_KEY="your_api_key"
export QUEST_COPILOT_VERBOSE=true
export QUEST_COPILOT_AUTO_APPLY=false
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Quest Error Analysis
on: [push, pull_request]

jobs:
  analyze-quest-errors:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Quest Copilot
        run: |
          pip install quest-dev-copilot
          
      - name: Build Unreal Project
        run: |
          # Your build commands here
          UnrealBuildTool.exe MyProject Android Development
        continue-on-error: true
        
      - name: Analyze Build Errors
        if: failure()
        run: |
          quest-fix Saved/Logs/MyProject.log \
            --output analysis.json \
            --backend-url ${{ secrets.QUEST_COPILOT_URL }}
            
      - name: Upload Analysis Results
        uses: actions/upload-artifact@v3
        with:
          name: error-analysis
          path: analysis.json
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                script {
                    try {
                        sh 'UnrealBuildTool.exe MyProject Android Development'
                    } catch (Exception e) {
                        // Continue to analysis stage
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Analyze Errors') {
            when {
                expression { currentBuild.result == 'UNSTABLE' }
            }
            steps {
                sh '''
                    quest-fix Saved/Logs/MyProject.log \
                        --output analysis.json \
                        --verbose
                '''
                
                archiveArtifacts artifacts: 'analysis.json'
                
                script {
                    def analysis = readJSON file: 'analysis.json'
                    if (analysis.auto_fix) {
                        echo "Auto-fix available: ${analysis.auto_fix.action}"
                    }
                }
            }
        }
    }
}
```

### GitLab CI

```yaml
stages:
  - build
  - analyze

build:
  stage: build
  script:
    - UnrealBuildTool.exe MyProject Android Development
  allow_failure: true
  artifacts:
    when: on_failure
    paths:
      - Saved/Logs/

analyze_errors:
  stage: analyze
  dependencies:
    - build
  when: on_failure
  script:
    - pip install quest-dev-copilot
    - quest-fix Saved/Logs/MyProject.log --output analysis.json
  artifacts:
    reports:
      junit: analysis.json
```

## Scripting and Automation

### Bash Script Integration

```bash
#!/bin/bash
# build_and_analyze.sh

set -e

PROJECT_NAME="MyQuestProject"
LOG_FILE="Saved/Logs/${PROJECT_NAME}.log"

echo "Building Quest project..."
if ! UnrealBuildTool.exe $PROJECT_NAME Android Development; then
    echo "Build failed, analyzing errors..."
    
    # Analyze errors
    python cli/quest_fix.py "$LOG_FILE" \
        --output "analysis_$(date +%Y%m%d_%H%M%S).json" \
        --verbose
    
    # Check if auto-fix is available
    if python cli/quest_fix.py "$LOG_FILE" --dry-run | grep -q "Auto-fix available"; then
        echo "Auto-fix detected. Apply? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            python cli/quest_fix.py "$LOG_FILE" --apply-fix
            echo "Fix applied. Rebuilding..."
            UnrealBuildTool.exe $PROJECT_NAME Android Development
        fi
    fi
fi
```

### PowerShell Script

```powershell
# BuildAndAnalyze.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [string]$LogPath = "Saved\Logs\$ProjectName.log",
    [string]$BackendUrl = "http://localhost:5000"
)

Write-Host "Building Quest project: $ProjectName"

try {
    & UnrealBuildTool.exe $ProjectName Android Development
    Write-Host "✅ Build successful!"
} catch {
    Write-Host "❌ Build failed, analyzing errors..."
    
    $analysis = python cli\quest_fix.py $LogPath --format json --backend-url $BackendUrl | ConvertFrom-Json
    
    Write-Host "Error Type: $($analysis.classification.error_type)"
    Write-Host "Confidence: $($analysis.classification.confidence * 100)%"
    
    if ($analysis.auto_fix) {
        $apply = Read-Host "Auto-fix available. Apply? (y/n)"
        if ($apply -eq "y") {
            python cli\quest_fix.py $LogPath --apply-fix --backend-url $BackendUrl
            Write-Host "🔧 Fix applied. Consider rebuilding."
        }
    }
}
```

## Advanced Usage

### Batch Processing

```bash
# Analyze multiple log files
for log in Saved/Logs/*.log; do
    echo "Analyzing $log..."
    python cli/quest_fix.py "$log" --output "${log%.log}_analysis.json"
done

# Or use xargs for parallel processing
find Saved/Logs -name "*.log" -print0 | \
    xargs -0 -P 4 -I {} python cli/quest_fix.py {} --output {}_analysis.json
```

### Custom Output Processing

```bash
# Extract only auto-fixable errors
python cli/quest_fix.py logfile.log --format json | \
    jq '.auto_fix // empty'

# Get error type statistics
python cli/quest_fix.py logfile.log --format json | \
    jq '.classification.error_type'

# Check if fix was successful
if python cli/quest_fix.py logfile.log --apply-fix --format json | \
   jq -e '.auto_fix_applied == true' > /dev/null; then
    echo "Fix applied successfully"
fi
```

### Integration with External Tools

```bash
# Send results to Slack
python cli/quest_fix.py logfile.log --format json | \
    jq -r '"Quest Error: " + .classification.error_type + " (" + (.classification.confidence * 100 | tostring) + "% confidence)"' | \
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"'"$(cat)"'"}' \
         $SLACK_WEBHOOK_URL

# Create GitHub issue
ANALYSIS=$(python cli/quest_fix.py logfile.log --format json)
ERROR_TYPE=$(echo "$ANALYSIS" | jq -r '.classification.error_type')
INSTRUCTIONS=$(echo "$ANALYSIS" | jq -r '.fix')

gh issue create \
    --title "Quest Build Error: $ERROR_TYPE" \
    --body "$INSTRUCTIONS" \
    --label "bug,quest,automated"
```

## Troubleshooting

### Common Issues

#### Backend Connection Failed
```bash
# Test backend connectivity
curl -f http://localhost:5000/health

# Check if backend is running
docker-compose ps backend

# Use different backend URL
python cli/quest_fix.py logfile.log --backend-url http://127.0.0.1:5000
```

#### Log File Not Found
```bash
# Check if file exists
ls -la path/to/logfile.log

# Use absolute path
python cli/quest_fix.py /full/path/to/logfile.log

# Find latest log file
find . -name "*.log" -type f -exec ls -t {} + | head -1
```

#### Permission Denied (Auto-fix)
```bash
# Check file permissions
ls -la MyProject.uproject

# Run with elevated permissions (if needed)
sudo python cli/quest_fix.py logfile.log --apply-fix

# Use dry-run to see what would be changed
python cli/quest_fix.py logfile.log --dry-run
```

#### Large Log Files
```bash
# Only analyze recent lines
tail -n 1000 large_logfile.log > recent.log
python cli/quest_fix.py recent.log

# Use timeout for large files
python cli/quest_fix.py large_logfile.log --timeout 120
```

### Debug Mode

```bash
# Enable debug output
QUEST_COPILOT_DEBUG=true python cli/quest_fix.py logfile.log --verbose

# Check configuration
python cli/quest_fix.py --help

# Validate JSON output
python cli/quest_fix.py logfile.log --format json | jq '.'
```

### Performance Optimization

```bash
# Use local backend for faster response
docker-compose up -d backend

# Cache responses (if supported)
python cli/quest_fix.py logfile.log --use-cache

# Parallel processing for multiple files
parallel python cli/quest_fix.py {} --output {}.analysis ::: *.log
```

## API Integration

The CLI tool is built on top of the Quest Copilot REST API. You can also use the API directly:

```bash
# Direct API call
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"log_content": "your log content here"}'

# Using the CLI as a wrapper
LOG_CONTENT=$(cat logfile.log)
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"log_content\": \"$LOG_CONTENT\"}"
```

This CLI tool provides a powerful, flexible interface for integrating Quest error analysis into your development workflow, whether you're working locally or in automated CI/CD pipelines.