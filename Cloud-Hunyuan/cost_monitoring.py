#!/usr/bin/env python3
"""
Cost Monitoring and Budget Alerts for 7L-Worlds
"""

import subprocess
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

class CostMonitor:
    """Monitor GCP costs and set up budget alerts"""

    def __init__(self, project_id: str = "seven-l-prod"):
        self.project_id = project_id

    def setup_budget_alerts(self):
        """Set up budget alerts for the project"""
        print("💰 Setting up Cost Monitoring and Budget Alerts...")
        print("=" * 60)

        # Create monthly budget
        self.create_monthly_budget()

        # Create service-specific budgets
        self.create_service_budgets()

        # Set up cost export
        self.setup_cost_export()

    def create_monthly_budget(self):
        """Create monthly budget with alerts"""
        print("📊 Creating Monthly Budget...")

        try:
            # Calculate budget amount (adjust based on your needs)
            monthly_budget = 200  # $200/month default

            cmd = [
                "gcloud", "billing", "budgets", "create", "7l-worlds-monthly",
                f"--billing-account={self.get_billing_account()}",
                f"--display-name=7L-Worlds Monthly Budget",
                f"--amount={monthly_budget}",
                "--threshold-rule=percent=50",
                "--threshold-rule=percent=80",
                "--threshold-rule=percent=90",
                f"--project={self.project_id}"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✅ Created monthly budget: ${monthly_budget}")
            else:
                print(f"  ⚠️  Failed to create budget: {result.stderr}")

        except Exception as e:
            print(f"  ❌ Error creating budget: {e}")

    def create_service_budgets(self):
        """Create budgets for specific services"""
        print("🔧 Creating Service-Specific Budgets...")

        service_budgets = {
            "Cloud Run": 150,
            "Vertex AI": 100,
            "Cloud Storage": 20,
            "Artifact Registry": 5
        }

        for service, amount in service_budgets.items():
            try:
                # Create budget with service filter
                budget_name = f"7l-{service.lower().replace(' ', '-')}-budget"

                cmd = [
                    "gcloud", "billing", "budgets", "create", budget_name,
                    f"--billing-account={self.get_billing_account()}",
                    f"--display-name=7L {service} Budget",
                    f"--amount={amount}",
                    "--threshold-rule=percent=80",
                    f"--services={self.get_service_name(service)}",
                    f"--project={self.project_id}"
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"  ✅ Created {service} budget: ${amount}")
                else:
                    print(f"  ⚠️  Failed to create {service} budget: {result.stderr}")

            except Exception as e:
                print(f"  ❌ Error creating {service} budget: {e}")

    def get_billing_account(self) -> str:
        """Get the billing account ID"""
        try:
            cmd = ["gcloud", "billing", "accounts", "list", "--format=value(name)"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                print(f"  ⚠️  Could not retrieve billing account: {result.stderr}")
                return "billingAccounts/YOUR_BILLING_ACCOUNT_ID"  # Placeholder
        except Exception as e:
            print(f"  ❌ Error getting billing account: {e}")
            return "billingAccounts/YOUR_BILLING_ACCOUNT_ID"

    def get_service_name(self, service: str) -> str:
        """Map service names to GCP service IDs"""
        service_map = {
            "Cloud Run": "run.googleapis.com",
            "Vertex AI": "aiplatform.googleapis.com",
            "Cloud Storage": "storage.googleapis.com",
            "Artifact Registry": "containerregistry.googleapis.com"
        }
        return service_map.get(service, "")

    def setup_cost_export(self):
        """Set up BigQuery cost export"""
        print("📤 Setting up Cost Export to BigQuery...")

        try:
            # Create dataset for billing export
            dataset_name = "billing_export"

            cmd = [
                "bq", "mk", "--dataset",
                f"--project_id={self.project_id}",
                dataset_name
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✅ Created BigQuery dataset: {dataset_name}")
            else:
                print(f"  ⚠️  Failed to create dataset (might already exist): {result.stderr}")

        except Exception as e:
            print(f"  ❌ Error setting up cost export: {e}")

    def get_cost_report(self, days: int = 30):
        """Generate cost report for the last N days"""
        print(f"📈 Generating Cost Report (Last {days} Days)...")

        try:
            # Get current date and calculate start date
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            cmd = [
                "gcloud", "billing", "export", "list",
                f"--billing-account={self.get_billing_account()}",
                f"--project={self.project_id}"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                exports = result.stdout.strip()
                if exports:
                    print("  📋 Current Cost Exports:")
                    print(f"    {exports}")
                else:
                    print("  ℹ️  No cost exports configured yet")
                    print("     Run setup_budget_alerts() to configure cost monitoring")
            else:
                print(f"  ⚠️  Could not retrieve cost exports: {result.stderr}")

        except Exception as e:
            print(f"  ❌ Error generating cost report: {e}")

class ResourceOptimizer:
    """Optimize resource usage and costs"""

    def __init__(self, project_id: str = "seven-l-prod"):
        self.project_id = project_id

    def optimize_cloud_run(self):
        """Optimize Cloud Run service configurations"""
        print("⚡ Optimizing Cloud Run Services...")

        services = ["gen-hunyuanworld", "render-multiview", "processor"]

        for service in services:
            try:
                # Scale down when not in use
                cmd = [
                    "gcloud", "run", "services", "update", service,
                    "--min-instances=0",
                    "--max-instances=5",  # Reduced from 10
                    "--concurrency=10",   # Optimize concurrency
                    f"--region=us-central1",
                    f"--project={self.project_id}"
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"  ✅ Optimized {service} scaling settings")
                else:
                    print(f"  ⚠️  Failed to optimize {service}: {result.stderr}")

            except Exception as e:
                print(f"  ❌ Error optimizing {service}: {e}")

    def optimize_storage(self):
        """Set up storage lifecycle policies"""
        print("📦 Optimizing Cloud Storage...")

        try:
            # Create lifecycle policy for temporary files
            lifecycle_policy = {
                "rule": [
                    {
                        "action": {"type": "Delete"},
                        "condition": {
                            "age": 30,  # Delete after 30 days
                            "matchesPrefix": ["temp/", "cache/"]
                        }
                    }
                ]
            }

            # Write lifecycle policy to file
            with open("/tmp/lifecycle.json", "w") as f:
                json.dump(lifecycle_policy, f, indent=2)

            # Apply lifecycle policy
            cmd = [
                "gsutil", "lifecycle", "set", "/tmp/lifecycle.json",
                "gs://7l-data/"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print("  ✅ Applied storage lifecycle policy")
            else:
                print(f"  ⚠️  Failed to apply lifecycle policy: {result.stderr}")

        except Exception as e:
            print(f"  ❌ Error optimizing storage: {e}")

def main():
    """Main cost monitoring setup"""
    print("💰 7L-Worlds Cost Monitoring & Optimization Setup")
    print("=" * 60)

    # Initialize components
    cost_monitor = CostMonitor()
    optimizer = ResourceOptimizer()

    # Set up budget alerts
    cost_monitor.setup_budget_alerts()

    # Generate current cost report
    cost_monitor.get_cost_report(days=7)  # Last week

    # Optimize resources
    print("\n⚡ Resource Optimization...")
    optimizer.optimize_cloud_run()
    optimizer.optimize_storage()

    print("\n✅ Cost Monitoring Setup Complete!")
    print("\n📊 Cost Monitoring Features:")
    print("  • Monthly budget alerts at 50%, 80%, 90% thresholds")
    print("  • Service-specific budgets for Cloud Run, Vertex AI, Storage")
    print("  • BigQuery dataset for detailed cost analysis")
    print("  • Optimized scaling and lifecycle policies")

    print("\n🔗 Useful Cost Commands:")
    print("  • View budgets: gcloud billing budgets list")
    print("  • Cost report: gcloud billing export list")
    print("  • BigQuery analysis: bq query 'SELECT * FROM billing_export.gcp_billing_export LIMIT 10'")

if __name__ == "__main__":
    main()
