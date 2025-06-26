# Flask Backend API Documentation

## Overview

The Quest Dev Copilot backend provides a RESTful API for error analysis, fix generation, and system monitoring. All endpoints return JSON responses and support CORS for cross-origin requests.

**Base URL**: `http://localhost:5000` (development)

## Authentication

Currently, the API does not require authentication for development. In production, implement API key authentication:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:5000/analyze
```

## Endpoints

### Health Check

**GET** `/health`

Check if the backend service is running and healthy.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "vector_db": "ready",
    "llama_api": "ready"
  }
}
```

**Status Codes**:
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is unhealthy

---

### Error Analysis

**POST** `/analyze`

Analyze an Unreal Engine error log and get AI-powered fixes.

**Request Body**:
```json
{
  "log_content": "string (required) - The error log content",
  "screenshot": "string (optional) - Base64 encoded screenshot",
  "use_cache": "boolean (optional) - Use cached response if available"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "log_content": "LogTemp: Error: Multiple XR plugins enabled...",
    "use_cache": false
  }'
```

**Response**:
```json
{
  "classification": {
    "error_type": "plugin_conflict",
    "confidence": 0.95,
    "key_indicators": ["OpenXR", "MetaXR", "conflict"],
    "auto_fixable": true,
    "reasoning": "Multiple XR plugins detected causing initialization conflict",
    "severity": "high"
  },
  "fix": "1. Open your .uproject file\n2. Locate the 'Plugins' section...",
  "auto_fix": {
    "action": "toggle_plugin",
    "plugin_name": "OpenXR",
    "enabled": false,
    "file_path": "*.uproject"
  },
  "sources": [
    {
      "url": "https://forums.unrealengine.com/example",
      "snippet": "Solution for OpenXR conflicts..."
    }
  ],
  "metrics": {
    "tokens_used": 1200,
    "estimated_cost": 0.024,
    "latency_ms": 2300,
    "model_used": "Llama-4-Scout-17B-16E-Instruct-FP8"
  },
  "cached": false
}
```

**Status Codes**:
- `200 OK` - Analysis completed successfully
- `400 Bad Request` - Invalid request body or missing log_content
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Analysis failed
- `503 Service Unavailable` - AI service unavailable

**Error Response**:
```json
{
  "error": "Missing log_content in request",
  "code": "INVALID_REQUEST",
  "details": {
    "required_fields": ["log_content"]
  }
}
```

---

### System Metrics

**GET** `/metrics`

Get usage metrics and system statistics.

**Response**:
```json
{
  "requests_today": 42,
  "avg_latency_ms": 3200,
  "total_tokens_used": 125000,
  "estimated_cost_today": 0.25,
  "error_distribution": {
    "plugin_conflict": 18,
    "sdk_mismatch": 15,
    "black_screen": 9,
    "other": 5
  },
  "success_rate": 0.94,
  "cache_hit_rate": 0.35
}
```

**Status Codes**:
- `200 OK` - Metrics retrieved successfully

---

### System Status

**GET** `/status`

Get detailed system status and service health.

**Response**:
```json
{
  "backend": "operational",
  "database": "connected",
  "ai_service": "connected",
  "uptime": "2d 14h 32m",
  "last_updated": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "development"
}
```

**Status Codes**:
- `200 OK` - Status retrieved successfully

---

### Bulk Analysis (Future)

**POST** `/analyze/bulk`

Analyze multiple log files in a batch operation.

**Request Body**:
```json
{
  "logs": [
    {
      "id": "log_1",
      "content": "Error log content 1..."
    },
    {
      "id": "log_2", 
      "content": "Error log content 2..."
    }
  ],
  "options": {
    "use_cache": true,
    "priority": "normal"
  }
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "log_1",
      "status": "success",
      "analysis": { /* Analysis result */ }
    },
    {
      "id": "log_2",
      "status": "failed", 
      "error": "Analysis timeout"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1,
    "total_cost": 0.048
  }
}
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Human readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_abc123"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_UNAVAILABLE` | 503 | Llama API or OpenAI unavailable |
| `ANALYSIS_TIMEOUT` | 504 | Analysis took too long |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Per IP**: 60 requests per minute
- **Per API Key**: 1000 requests per hour  
- **Burst**: Up to 10 requests in 10 seconds

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234567
```

## Request/Response Examples

### Plugin Conflict Analysis

**Request**:
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "log_content": "LogTemp: Error: Multiple XR plugins are enabled. OpenXR conflicts with MetaXR.\nLogXR: Error: Failed to initialize XR system due to plugin conflict",
    "use_cache": false
  }'
```

**Response**:
```json
{
  "classification": {
    "error_type": "plugin_conflict",
    "confidence": 0.98,
    "key_indicators": ["Multiple XR plugins", "OpenXR", "MetaXR"],
    "auto_fixable": true,
    "severity": "high"
  },
  "fix": "To resolve this OpenXR/MetaXR conflict:\n\n1. Open your project's .uproject file\n2. Find the \"Plugins\" section\n3. Set OpenXR plugin enabled to false:\n   ```json\n   {\n     \"Name\": \"OpenXR\",\n     \"Enabled\": false\n   }\n   ```\n4. Save the file and regenerate project files\n5. Rebuild your project",
  "auto_fix": {
    "action": "toggle_plugin",
    "plugin_name": "OpenXR", 
    "enabled": false,
    "file_path": "*.uproject"
  }
}
```

### SDK Mismatch Analysis

**Request**:
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "log_content": "LogAndroid: Error: Target SDK version 33 is not supported for Quest development\nLogPackaging: Error: Android packaging failed due to SDK version mismatch"
  }'
```

**Response**:
```json
{
  "classification": {
    "error_type": "sdk_mismatch",
    "confidence": 0.92,
    "key_indicators": ["SDK version 33", "Quest development", "Android packaging"],
    "auto_fixable": true,
    "severity": "medium"
  },
  "fix": "Quest development requires Android SDK 32. Update your configuration:\n\n1. Open Config/DefaultEngine.ini\n2. Find [/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]\n3. Set TargetSDKVersion=32\n4. Save and rebuild",
  "auto_fix": {
    "action": "update_config",
    "file_path": "Config/DefaultEngine.ini",
    "section": "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]",
    "key": "TargetSDKVersion", 
    "value": "32"
  }
}
```

## WebSocket API (Future)

For real-time log monitoring and analysis:

**Connection**: `ws://localhost:5000/ws`

### Events

**Client → Server**:
```json
{
  "type": "start_monitoring",
  "log_path": "/path/to/logfile.log"
}
```

**Server → Client**:
```json
{
  "type": "error_detected",
  "error_type": "plugin_conflict",
  "confidence": 0.95,
  "auto_fix_available": true
}
```

## Development

### Running the API Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LLAMA_API_KEY="your_key"
export OPENAI_API_KEY="your_key"

# Start the server
python backend/app.py
```

### Testing the API

```bash
# Health check
curl http://localhost:5000/health

# Test analysis with sample log
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d @sample_logs/plugin_conflict.json
```

### API Documentation Generation

The API uses OpenAPI/Swagger for documentation:

```bash
# Generate OpenAPI spec
python scripts/generate_openapi.py

# Serve interactive docs
python -m flask run --debug
# Visit http://localhost:5000/docs
```

## Production Deployment

### Environment Variables

```bash
FLASK_ENV=production
FLASK_DEBUG=false
LLAMA_API_KEY=prod_key
OPENAI_API_KEY=prod_key
RATE_LIMIT_ENABLED=true
LOG_LEVEL=INFO
```

### Docker Deployment

```bash
# Build image
docker build -f Dockerfile.backend -t quest-copilot-api .

# Run with environment
docker run -d \
  -p 5000:5000 \
  -e LLAMA_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  quest-copilot-api
```

### Load Balancing

For production, use multiple backend instances:

```nginx
upstream quest_copilot_backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://quest_copilot_backend;
    }
}
```