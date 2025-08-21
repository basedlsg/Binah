# Deploying the Application

This runbook describes how to deploy the application to Firebase Hosting.

## Prerequisites

- You have the Firebase CLI installed and configured.
- You are logged into the correct Firebase project.

## Deployment Steps

1.  **Make the script executable:**

    ```bash
    chmod +x infra/scripts/deploy.sh
    ```

2.  **Run the deployment script:**

    ```bash
    ./infra/scripts/deploy.sh
    ```

The script will first build the client application and then deploy the contents of the `www` directory to Firebase Hosting.