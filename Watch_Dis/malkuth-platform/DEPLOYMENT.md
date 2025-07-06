# Malkuth Platform Deployment Guide

This guide covers the complete deployment process for the Malkuth Platform, a sophisticated content engagement orchestration system.

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Vercel account
- Domain name (optional)

## Environment Setup

### 1. Environment Variables

Copy the environment template and configure your values:

```bash
cp .env.production.example .env.production
```

Required environment variables:

```env
# Gemini API Configuration
GEMINI_API_KEY=AIzaSyAqko3NqGS-GtXhzm8LeiZ3xUEyo_XIqLo
GEMINI_MODEL=gemini-pro

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_API_KEY=your-api-key

# Application Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secure-secret
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
CRON_SECRET=your-cron-secret

# Performance
CACHE_TTL=7200
API_RATE_LIMIT_MAX=50
API_RATE_LIMIT_WINDOW=3600000
```

### 2. Google Cloud Setup

#### Create a new Google Cloud Project:

```bash
gcloud projects create malkuth-platform-prod --name="Malkuth Platform"
gcloud config set project malkuth-platform-prod
```

#### Enable required APIs:

```bash
gcloud services enable \
  storage-api.googleapis.com \
  run.googleapis.com \
  sql-admin.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

#### Create a Cloud Storage bucket:

```bash
gsutil mb -p malkuth-platform-prod gs://malkuth-platform-storage
gsutil lifecycle set storage-lifecycle.json gs://malkuth-platform-storage
```

#### Set up IAM and Service Accounts:

```bash
# Create service account
gcloud iam service-accounts create malkuth-platform-sa \
  --display-name="Malkuth Platform Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding malkuth-platform-prod \
  --member="serviceAccount:malkuth-platform-sa@malkuth-platform-prod.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create ./malkuth-key.json \
  --iam-account=malkuth-platform-sa@malkuth-platform-prod.iam.gserviceaccount.com
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 2. Configure Project

```bash
vercel init
vercel env add GEMINI_API_KEY
vercel env add GOOGLE_CLOUD_PROJECT_ID
vercel env add NEXTAUTH_SECRET
# Add all other environment variables
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Configure Domain (Optional)

```bash
vercel domains add your-domain.com
vercel alias your-deployment-url.vercel.app your-domain.com
```

## Database Setup (Optional)

If using PostgreSQL:

### 1. Create Cloud SQL Instance

```bash
gcloud sql instances create malkuth-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=us-central1
```

### 2. Create Database and User

```bash
gcloud sql databases create malkuth_platform --instance=malkuth-db
gcloud sql users create malkuth_user --instance=malkuth-db --password=secure_password
```

### 3. Update Environment Variables

```env
DATABASE_URL=postgresql://malkuth_user:secure_password@/malkuth_platform?host=/cloudsql/malkuth-platform-prod:us-central1:malkuth-db
```

## Monitoring and Alerting

### 1. Set up Monitoring

```bash
# Create monitoring dashboard
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

### 2. Configure Alerts

```bash
# Create alert policies
gcloud alpha monitoring policies create --policy-from-file=alert-policies.yaml
```

### 3. Health Checks

The platform includes several monitoring endpoints:

- `/api/health` - Basic health check
- `/api/monitoring?type=metrics` - Performance metrics
- `/api/monitoring?type=system` - System status
- `/api/monitoring?type=recommendations` - Optimization recommendations

## Performance Optimization

### 1. CDN Configuration

Configure Vercel's Edge Network for optimal performance:

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Database Optimization

- Enable connection pooling
- Set up read replicas for analytics queries
- Implement proper indexing strategy

### 3. Caching Strategy

The platform implements multi-layer caching:

- Application-level cache (in-memory)
- CDN caching for static assets
- API response caching with appropriate TTLs

## Security Hardening

### 1. Environment Security

```bash
# Store secrets in Google Secret Manager
gcloud secrets create gemini-api-key --data-file=- <<< "your-api-key"
gcloud secrets create jwt-secret --data-file=- <<< "your-jwt-secret"
```

### 2. Network Security

- Configure firewall rules
- Enable HTTPS everywhere
- Implement rate limiting
- Set up WAF rules

### 3. API Security

- JWT-based authentication
- Role-based access control
- Request rate limiting
- Input validation and sanitization

## Scaling Configuration

### 1. Auto-scaling Settings

```yaml
# vercel.json functions configuration
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. Resource Limits

Configure appropriate resource limits:

- API rate limiting: 50 requests/hour per IP
- Max concurrent campaigns: 100
- Max bots per user: 1000
- Cache size: 1000 entries
- Memory limit: 1GB per function

## Backup and Recovery

### 1. Data Backup

```bash
# Set up automated backups
gcloud sql backups create --instance=malkuth-db --description="Daily backup"

# Configure retention policy
gcloud sql instances patch malkuth-db --backup-start-time=02:00
```

### 2. Disaster Recovery

- Multi-region deployment strategy
- Automated failover procedures
- Data replication setup
- Recovery time objectives (RTO): 15 minutes
- Recovery point objectives (RPO): 1 hour

## Deployment Checklist

### Pre-deployment:

- [ ] Environment variables configured
- [ ] Google Cloud services enabled
- [ ] Service accounts created with proper permissions
- [ ] Database schema applied
- [ ] SSL certificates configured
- [ ] Monitoring and alerting set up

### Deployment:

- [ ] Code built and tested locally
- [ ] Integration tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Post-deployment:

- [ ] Health checks passing
- [ ] Monitoring dashboards active
- [ ] Performance metrics baseline established
- [ ] User acceptance testing completed
- [ ] Backup verification
- [ ] Rollback plan tested

## Troubleshooting

### Common Issues:

1. **Gemini API Errors**
   - Check API key configuration
   - Verify API quotas and limits
   - Review request patterns

2. **Performance Issues**
   - Check cache hit rates
   - Monitor memory usage
   - Review database query performance

3. **Authentication Failures**
   - Verify JWT secret configuration
   - Check user permissions
   - Review rate limiting settings

### Debugging Commands:

```bash
# Check deployment status
vercel inspect

# View logs
vercel logs

# Monitor performance
curl https://your-domain.com/api/monitoring?type=metrics

# Health check
curl https://your-domain.com/api/health
```

## Maintenance

### Regular Tasks:

1. **Daily**
   - Monitor system health
   - Check error rates
   - Review performance metrics

2. **Weekly**
   - Performance optimization review
   - Security updates
   - Backup verification

3. **Monthly**
   - Cost optimization review
   - Capacity planning
   - Security audit

### Automated Maintenance:

The platform includes automated maintenance tasks via cron jobs:

- Cache cleanup: Every hour
- Metrics reset: Weekly
- Data archival: Daily at 2 AM UTC
- Health checks: Every 5 minutes

## Support and Documentation

- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Performance Tuning Guide](./PERFORMANCE.md)
- [Security Guidelines](./SECURITY.md)

For support, contact: support@malkuth-platform.com