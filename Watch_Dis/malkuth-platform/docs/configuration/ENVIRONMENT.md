# Environment Variables Configuration

This document provides comprehensive configuration details for all environment variables used in Malkuth Platform.

## 🔧 Environment Setup

### Configuration Files

**Development:**
- `.env.local` - Local development overrides
- `.env.development` - Development environment defaults

**Production:**
- `.env.production` - Production environment settings
- Environment variables set directly in hosting platform

**Testing:**
- `.env.test` - Test environment configuration

### Variable Priority

Environment variables are loaded in this order (higher priority overrides lower):
1. System environment variables
2. `.env.local`
3. `.env.[NODE_ENV]` (e.g., `.env.production`)
4. `.env`

## 🔑 Required Variables

### Google Cloud Configuration

#### GOOGLE_CLOUD_PROJECT_ID
- **Type**: String
- **Required**: Yes
- **Description**: Your Google Cloud Platform project ID
- **Example**: `malkuth-platform-prod`
- **Notes**: Used for all Google Cloud services integration

```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
```

#### GOOGLE_CLOUD_KEY_FILE
- **Type**: String (file path)
- **Required**: Yes
- **Description**: Path to Google Cloud service account JSON key file
- **Example**: `./keys/service-account.json`
- **Security**: Keep this file secure and never commit to version control

```env
GOOGLE_CLOUD_KEY_FILE=./keys/gcp-service-account.json
```

#### GOOGLE_CLOUD_STORAGE_BUCKET
- **Type**: String
- **Required**: Yes
- **Description**: Name of your Google Cloud Storage bucket for content storage
- **Example**: `malkuth-content-storage`
- **Notes**: Bucket must exist and service account must have access

```env
GOOGLE_CLOUD_STORAGE_BUCKET=your-storage-bucket-name
```

### Application Configuration

#### NODE_ENV
- **Type**: String
- **Required**: Yes
- **Default**: `development`
- **Values**: `development` | `production` | `test`
- **Description**: Determines the application environment and behavior

```env
NODE_ENV=production
```

#### NEXT_PUBLIC_APP_URL
- **Type**: String (URL)
- **Required**: Yes
- **Description**: Public URL where the application is hosted
- **Example**: `https://malkuth.yourdomain.com`
- **Notes**: Used for generating absolute URLs and CORS configuration

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🎛 Optional Variables

### Gemini API Configuration

#### GEMINI_API_KEY
- **Type**: String
- **Required**: No
- **Description**: API key for Google Gemini AI services
- **Usage**: Content analysis, comment generation, sentiment analysis
- **Notes**: Required for AI-powered features

```env
GEMINI_API_KEY=your-gemini-api-key
```

#### GEMINI_MODEL
- **Type**: String
- **Required**: No
- **Default**: `gemini-pro`
- **Description**: Gemini model to use for AI operations
- **Options**: `gemini-pro`, `gemini-pro-vision`

```env
GEMINI_MODEL=gemini-pro
```

#### GEMINI_TEMPERATURE
- **Type**: Number (0-1)
- **Required**: No
- **Default**: `0.7`
- **Description**: Controls randomness in AI responses (0 = deterministic, 1 = very random)

```env
GEMINI_TEMPERATURE=0.7
```

### CDN and Performance

#### CDN_BASE_URL
- **Type**: String (URL)
- **Required**: No
- **Description**: CDN endpoint for faster content delivery
- **Example**: `https://cdn.yourdomain.com`
- **Benefits**: Improved performance and reduced bandwidth costs

```env
CDN_BASE_URL=https://cdn.yourdomain.com
```

#### ENABLE_CDN_CACHING
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable CDN caching for static assets

```env
ENABLE_CDN_CACHING=true
```

#### CACHE_TTL_SECONDS
- **Type**: Number
- **Required**: No
- **Default**: `3600` (1 hour)
- **Description**: Default cache time-to-live in seconds

```env
CACHE_TTL_SECONDS=3600
```

### Analytics Configuration

#### ANALYTICS_ENABLED
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable/disable analytics collection

```env
ANALYTICS_ENABLED=true
```

#### REAL_TIME_UPDATES
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable real-time analytics updates via WebSocket

```env
REAL_TIME_UPDATES=true
```

#### ANALYTICS_BATCH_SIZE
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Number of analytics events to batch before processing

```env
ANALYTICS_BATCH_SIZE=100
```

#### ANALYTICS_FLUSH_INTERVAL
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `30000` (30 seconds)
- **Description**: Interval to flush analytics batches

```env
ANALYTICS_FLUSH_INTERVAL=30000
```

### Bot System Configuration

#### MAX_CONCURRENT_BOTS
- **Type**: Number
- **Required**: No
- **Default**: `1000`
- **Description**: Maximum number of concurrent bot personas

```env
MAX_CONCURRENT_BOTS=1000
```

#### BOT_AUTHENTICITY_THRESHOLD
- **Type**: Number (0-1)
- **Required**: No
- **Default**: `0.7`
- **Description**: Minimum authenticity score for bot actions

```env
BOT_AUTHENTICITY_THRESHOLD=0.7
```

#### DEFAULT_ENGAGEMENT_FREQUENCY
- **Type**: String
- **Required**: No
- **Default**: `medium`
- **Values**: `low` | `medium` | `high`
- **Description**: Default engagement frequency for new bots

```env
DEFAULT_ENGAGEMENT_FREQUENCY=medium
```

### Campaign Configuration

#### MAX_CONCURRENT_CAMPAIGNS
- **Type**: Number
- **Required**: No
- **Default**: `10`
- **Description**: Maximum number of concurrent engagement campaigns

```env
MAX_CONCURRENT_CAMPAIGNS=10
```

#### CAMPAIGN_RATE_LIMIT_HOUR
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum engagements per hour per campaign

```env
CAMPAIGN_RATE_LIMIT_HOUR=100
```

#### CAMPAIGN_RATE_LIMIT_DAY
- **Type**: Number
- **Required**: No
- **Default**: `1000`
- **Description**: Maximum engagements per day per campaign

```env
CAMPAIGN_RATE_LIMIT_DAY=1000
```

#### EMERGENCY_STOP_ENABLED
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable emergency stop functionality

```env
EMERGENCY_STOP_ENABLED=true
```

### Security Configuration

#### API_RATE_LIMIT
- **Type**: Number
- **Required**: No
- **Default**: `1000`
- **Description**: API requests per hour per IP

```env
API_RATE_LIMIT=1000
```

#### CORS_ORIGINS
- **Type**: String (comma-separated URLs)
- **Required**: No
- **Description**: Allowed CORS origins for API requests
- **Example**: `https://domain1.com,https://domain2.com`

```env
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### ENABLE_API_AUTHENTICATION
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Require authentication for API access

```env
ENABLE_API_AUTHENTICATION=true
```

#### JWT_SECRET
- **Type**: String
- **Required**: No (but recommended for production)
- **Description**: Secret key for JWT token signing
- **Security**: Use a strong, random secret

```env
JWT_SECRET=your-very-long-random-secret-string
```

### Database Configuration

#### DATABASE_URL
- **Type**: String (connection URL)
- **Required**: No (uses in-memory storage if not provided)
- **Description**: Database connection URL
- **Formats**: 
  - PostgreSQL: `postgresql://user:pass@host:5432/db`
  - MongoDB: `mongodb://user:pass@host:27017/db`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/malkuth
```

#### DATABASE_POOL_SIZE
- **Type**: Number
- **Required**: No
- **Default**: `10`
- **Description**: Database connection pool size

```env
DATABASE_POOL_SIZE=10
```

### File Processing Configuration

#### MAX_FILE_SIZE_MB
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum file size in megabytes

```env
MAX_FILE_SIZE_MB=100
```

#### SUPPORTED_VIDEO_FORMATS
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `mp4,mov,avi,webm`
- **Description**: Supported video file formats

```env
SUPPORTED_VIDEO_FORMATS=mp4,mov,avi,webm,mkv
```

#### SUPPORTED_AUDIO_FORMATS
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `mp3,wav,flac,ogg`
- **Description**: Supported audio file formats

```env
SUPPORTED_AUDIO_FORMATS=mp3,wav,flac,ogg,m4a
```

#### FFMPEG_PATH
- **Type**: String (file path)
- **Required**: No
- **Description**: Path to FFmpeg executable (auto-detected if not provided)

```env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

#### VIDEO_PROCESSING_QUALITY
- **Type**: String
- **Required**: No
- **Default**: `balanced`
- **Values**: `fast` | `balanced` | `high_quality`
- **Description**: Video processing quality vs speed trade-off

```env
VIDEO_PROCESSING_QUALITY=balanced
```

### Logging Configuration

#### LOG_LEVEL
- **Type**: String
- **Required**: No
- **Default**: `info`
- **Values**: `error` | `warn` | `info` | `debug`
- **Description**: Minimum log level to output

```env
LOG_LEVEL=info
```

#### LOG_FORMAT
- **Type**: String
- **Required**: No
- **Default**: `json`
- **Values**: `json` | `text`
- **Description**: Log output format

```env
LOG_FORMAT=json
```

#### ENABLE_REQUEST_LOGGING
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Log all HTTP requests

```env
ENABLE_REQUEST_LOGGING=true
```

### Development Configuration

#### ENABLE_STORYBOOK
- **Type**: Boolean
- **Required**: No
- **Default**: `true` (development only)
- **Description**: Enable Storybook component development

```env
ENABLE_STORYBOOK=true
```

#### HOT_RELOAD
- **Type**: Boolean
- **Required**: No
- **Default**: `true` (development only)
- **Description**: Enable hot reloading for development

```env
HOT_RELOAD=true
```

#### ENABLE_SOURCE_MAPS
- **Type**: Boolean
- **Required**: No
- **Default**: `true` (development), `false` (production)
- **Description**: Generate source maps for debugging

```env
ENABLE_SOURCE_MAPS=true
```

## 📝 Environment Templates

### Development Template (.env.local)

```env
# Required Variables
GOOGLE_CLOUD_PROJECT_ID=malkuth-dev
GOOGLE_CLOUD_KEY_FILE=./keys/dev-service-account.json
GOOGLE_CLOUD_STORAGE_BUCKET=malkuth-dev-storage
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Development Settings
ANALYTICS_ENABLED=true
REAL_TIME_UPDATES=true
LOG_LEVEL=debug
ENABLE_STORYBOOK=true
HOT_RELOAD=true

# Bot Configuration
MAX_CONCURRENT_BOTS=100
BOT_AUTHENTICITY_THRESHOLD=0.5
DEFAULT_ENGAGEMENT_FREQUENCY=low

# Campaign Configuration
MAX_CONCURRENT_CAMPAIGNS=3
CAMPAIGN_RATE_LIMIT_HOUR=50
CAMPAIGN_RATE_LIMIT_DAY=500
```

### Production Template (.env.production)

```env
# Required Variables
GOOGLE_CLOUD_PROJECT_ID=malkuth-prod
GOOGLE_CLOUD_KEY_FILE=/app/keys/prod-service-account.json
GOOGLE_CLOUD_STORAGE_BUCKET=malkuth-prod-storage
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://malkuth.yourdomain.com

# Performance Configuration
CDN_BASE_URL=https://cdn.yourdomain.com
ENABLE_CDN_CACHING=true
CACHE_TTL_SECONDS=3600

# Security Configuration
API_RATE_LIMIT=1000
CORS_ORIGINS=https://yourdomain.com
ENABLE_API_AUTHENTICATION=true
JWT_SECRET=your-production-jwt-secret

# Analytics Configuration
ANALYTICS_ENABLED=true
REAL_TIME_UPDATES=true
ANALYTICS_BATCH_SIZE=500
ANALYTICS_FLUSH_INTERVAL=15000

# Bot Configuration
MAX_CONCURRENT_BOTS=1000
BOT_AUTHENTICITY_THRESHOLD=0.8
DEFAULT_ENGAGEMENT_FREQUENCY=medium

# Campaign Configuration
MAX_CONCURRENT_CAMPAIGNS=10
CAMPAIGN_RATE_LIMIT_HOUR=100
CAMPAIGN_RATE_LIMIT_DAY=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true
ENABLE_SOURCE_MAPS=false
```

### Testing Template (.env.test)

```env
# Required Variables
GOOGLE_CLOUD_PROJECT_ID=malkuth-test
GOOGLE_CLOUD_KEY_FILE=./keys/test-service-account.json
GOOGLE_CLOUD_STORAGE_BUCKET=malkuth-test-storage
NODE_ENV=test
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Test Configuration
ANALYTICS_ENABLED=false
REAL_TIME_UPDATES=false
LOG_LEVEL=error

# Reduced Limits for Testing
MAX_CONCURRENT_BOTS=10
MAX_CONCURRENT_CAMPAIGNS=2
CAMPAIGN_RATE_LIMIT_HOUR=10
CAMPAIGN_RATE_LIMIT_DAY=100

# Fast Processing for Tests
VIDEO_PROCESSING_QUALITY=fast
ANALYTICS_BATCH_SIZE=5
ANALYTICS_FLUSH_INTERVAL=1000
```

## ✅ Validation and Troubleshooting

### Environment Validation

The application automatically validates environment variables on startup. Common validation errors:

#### Missing Required Variables
```
Error: Missing required environment variable: GOOGLE_CLOUD_PROJECT_ID
```
**Solution**: Add the missing variable to your environment configuration.

#### Invalid File Paths
```
Error: Google Cloud key file not found: ./keys/service-account.json
```
**Solution**: Verify the file path is correct and the file exists.

#### Invalid URLs
```
Error: Invalid URL format for NEXT_PUBLIC_APP_URL
```
**Solution**: Ensure URLs include protocol (http:// or https://).

#### Invalid Numbers
```
Error: MAX_CONCURRENT_BOTS must be a positive integer
```
**Solution**: Check that numeric values are valid numbers within acceptable ranges.

### Common Issues and Solutions

#### Google Cloud Authentication Errors
```
Error: Google Cloud authentication failed
```
**Solutions:**
1. Verify service account key file exists and is valid JSON
2. Check service account permissions
3. Ensure project ID is correct
4. Verify billing is enabled on GCP project

#### Storage Bucket Access Errors
```
Error: Unable to access storage bucket
```
**Solutions:**
1. Verify bucket name is correct
2. Check service account has Storage Admin role
3. Ensure bucket exists in the specified project
4. Verify bucket region matches your configuration

#### Rate Limiting Issues
```
Warning: Rate limit exceeded for bot actions
```
**Solutions:**
1. Increase rate limit values if appropriate
2. Check bot authenticity scores
3. Review campaign parameters
4. Monitor system performance

### Environment Debugging

#### Debug Mode
Enable debug logging to troubleshoot environment issues:

```env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

#### Configuration Validation
Add this to your startup script to validate configuration:

```bash
# Validate required environment variables
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
  echo "Error: GOOGLE_CLOUD_PROJECT_ID is required"
  exit 1
fi

if [ ! -f "$GOOGLE_CLOUD_KEY_FILE" ]; then
  echo "Error: Google Cloud key file not found: $GOOGLE_CLOUD_KEY_FILE"
  exit 1
fi

echo "Environment validation passed"
```

## 🔒 Security Best Practices

### Sensitive Data Handling

1. **Never commit sensitive data**: Use `.gitignore` to exclude environment files
2. **Use strong secrets**: Generate cryptographically secure secrets for JWT_SECRET
3. **Rotate keys regularly**: Update API keys and service account keys periodically
4. **Principle of least privilege**: Grant minimum necessary permissions to service accounts
5. **Monitor access**: Enable audit logging for sensitive operations

### Production Security

1. **Environment isolation**: Use separate environments for development, staging, and production
2. **Encrypted storage**: Store sensitive environment variables encrypted
3. **Access control**: Limit who can view and modify production environment variables
4. **Regular audits**: Review environment configurations regularly
5. **Backup configurations**: Maintain secure backups of environment configurations

### Service Account Security

1. **Dedicated accounts**: Use separate service accounts for different environments
2. **Regular rotation**: Rotate service account keys every 90 days
3. **Audit permissions**: Regularly review and minimize service account permissions
4. **Monitor usage**: Track service account usage for unusual patterns

---

This environment configuration guide ensures your Malkuth Platform instance is properly configured for optimal performance, security, and functionality. Regular review and updates of these configurations are recommended as your platform grows and evolves.