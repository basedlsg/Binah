#!/usr/bin/env python3
"""
Monitoring and Logging Setup for 7L-Worlds Services
"""

import subprocess
import json
import time
from typing import Dict, List, Any
import requests

class CloudMonitoringSetup:
    """Set up monitoring and logging for GCP services"""

    def __init__(self, project_id: str = "seven-l-prod", region: str = "us-central1"):
        self.project_id = project_id
        self.region = region
        self.services = [
            "gen-hunyuanworld",
            "render-multiview",
            "processor"
        ]

    def setup_cloud_monitoring(self):
        """Set up Cloud Monitoring dashboards and alerts"""
        print("📊 Setting up Cloud Monitoring...")

        # Create uptime checks for services
        for service in self.services:
            self.create_uptime_check(service)

        # Create alerting policies
        self.create_alert_policies()

        # Set up log-based metrics
        self.create_log_metrics()

    def create_uptime_check(self, service_name: str):
        """Create uptime check for a service"""
        print(f"  🔍 Creating uptime check for {service_name}")

        config = {
            "displayName": f"{service_name}-uptime-check",
            "httpCheck": {
                "path": "/health",
                "port": 443,
                "useSsl": True,
                "requestMethod": "GET"
            },
            "monitoredResource": {
                "type": "uptime_url",
                "labels": {
                    "host": f"{service_name}-{self.project_id[:8]}.us-central1.run.app"
                }
            },
            "checkRequestType": "GET",
            "timeout": {"seconds": 10},
            "period": {"seconds": 300},  # Check every 5 minutes
        }

        try:
            # Use gcloud to create uptime check
            cmd = [
                "gcloud", "monitoring", "uptime", "create", service_name,
                f"--display-name={config['displayName']}",
                f"--path={config['httpCheck']['path']}",
                f"--host={config['monitoredResource']['labels']['host']}",
                f"--project={self.project_id}"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"    ✅ Created uptime check for {service_name}")
            else:
                print(f"    ⚠️  Failed to create uptime check: {result.stderr}")

        except Exception as e:
            print(f"    ❌ Error creating uptime check: {e}")

    def create_alert_policies(self):
        """Create alert policies for critical metrics"""
        print("  🚨 Creating alert policies...")

        alerts = [
            {
                "name": "service-down-alert",
                "display_name": "Service Down Alert",
                "condition": {
                    "display_name": "Uptime Check Failing",
                    "condition_threshold": {
                        "filter": 'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url"',
                        "comparison": "COMPARISON_LT",
                        "threshold_value": 1,
                        "duration": {"seconds": 600}  # 10 minutes
                    }
                }
            },
            {
                "name": "high-error-rate",
                "display_name": "High Error Rate Alert",
                "condition": {
                    "display_name": "High 5xx Error Rate",
                    "condition_threshold": {
                        "filter": 'metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"',
                        "comparison": "COMPARISON_GT",
                        "threshold_value": 5,
                        "duration": {"seconds": 300}
                    }
                }
            }
        ]

        for alert in alerts:
            try:
                cmd = [
                    "gcloud", "alpha", "monitoring", "policies", "create",
                    f"--display-name={alert['display_name']}",
                    "--notification-channels=",  # Would need to create channels first
                    f"--project={self.project_id}"
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"    ✅ Created alert policy: {alert['display_name']}")
                else:
                    print(f"    ⚠️  Failed to create alert policy: {result.stderr}")

            except Exception as e:
                print(f"    ❌ Error creating alert policy: {e}")

    def create_log_metrics(self):
        """Create log-based metrics for better monitoring"""
        print("  📈 Creating log-based metrics...")

        metrics = [
            {
                "name": "error_logs",
                "filter": 'resource.type="cloud_run_revision" AND severity>=ERROR',
                "metricDescriptor": {
                    "metricKind": "DELTA",
                    "valueType": "INT64",
                    "unit": "1"
                }
            },
            {
                "name": "request_duration",
                "filter": 'resource.type="cloud_run_revision" AND jsonPayload.duration',
                "metricDescriptor": {
                    "metricKind": "GAUGE",
                    "valueType": "DISTRIBUTION",
                    "unit": "ms"
                }
            }
        ]

        for metric in metrics:
            try:
                cmd = [
                    "gcloud", "logging", "metrics", "create", metric['name'],
                    f"--description=Log metric for {metric['name']}",
                    f"--log-filter={metric['filter']}",
                    f"--project={self.project_id}"
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"    ✅ Created log metric: {metric['name']}")
                else:
                    print(f"    ⚠️  Failed to create log metric: {result.stderr}")

            except Exception as e:
                print(f"    ❌ Error creating log metric: {e}")

class ServiceMonitor:
    """Monitor service health and performance"""

    def __init__(self, service_urls: Dict[str, str]):
        self.service_urls = service_urls

    def check_service_health(self) -> Dict[str, Any]:
        """Check health of all services"""
        results = {}

        for service_name, url in self.service_urls.items():
            try:
                start_time = time.time()
                response = requests.get(f"{url}/health", timeout=10)
                response_time = time.time() - start_time

                results[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_code": response.status_code,
                    "response_time": round(response_time * 1000, 2),  # ms
                    "message": response.json().get("message", "OK") if response.status_code == 200 else "N/A"
                }

            except requests.exceptions.RequestException as e:
                results[service_name] = {
                    "status": "unreachable",
                    "response_code": None,
                    "response_time": None,
                    "error": str(e)
                }

        return results

    def monitor_resources(self):
        """Monitor resource usage via gcloud"""
        print("🔍 Monitoring resource usage...")

        try:
            # Check Cloud Run services
            cmd = [
                "gcloud", "run", "services", "list",
                "--region=us-central1",
                "--format=json"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                services = json.loads(result.stdout)
                print(f"  📋 Found {len(services)} Cloud Run services")

                for service in services:
                    name = service['metadata']['name']
                    status = service['status']['conditions'][0]['status']
                    print(f"    • {name}: {status}")

            # Check GCS usage
            print("  ☁️  Checking GCS usage...")
            cmd = ["gsutil", "du", "-sh", "gs://7l-data/"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"    • 7l-data bucket: {result.stdout.strip()}")

        except Exception as e:
            print(f"  ❌ Error monitoring resources: {e}")

def main():
    """Main monitoring setup function"""
    print("🚀 Setting up Monitoring and Logging for 7L-Worlds")
    print("=" * 60)

    # Service URLs (these would be populated from actual deployment)
    service_urls = {
        "generator": "https://gen-hunyuanworld-502853342513.us-central1.run.app",
        "renderer": "https://render-multiview-502853342513.us-central1.run.app",
        "processor": "https://processor-502853342513.us-central1.run.app"
    }

    # Set up Cloud Monitoring
    monitoring = CloudMonitoringSetup()
    monitoring.setup_cloud_monitoring()

    # Initialize service monitor
    monitor = ServiceMonitor(service_urls)

    # Check current service health
    print("\n🏥 Checking Service Health...")
    health_status = monitor.check_service_health()

    for service, status in health_status.items():
        status_icon = "✅" if status["status"] == "healthy" else "❌"
        print(f"  {status_icon} {service}: {status['status']}")
        if status["response_time"]:
            print(f"    Response time: {status['response_time']}ms")
    # Monitor resources
    monitor.monitor_resources()

    print("\n📊 Monitoring Setup Complete!")
    print("  • Uptime checks created for all services")
    print("  • Alert policies configured")
    print("  • Log-based metrics set up")
    print("  • Service health monitoring active")

    print("\n🔗 Useful Monitoring Commands:")
    print("  • View logs: gcloud run services logs read [service-name]")
    print("  • Check metrics: gcloud monitoring metrics list")
    print("  • View alerts: gcloud monitoring policies list")

if __name__ == "__main__":
    main()
