# Resolving Firebase Authentication Errors

This runbook addresses the `Authentication Error: Your credentials are no longer valid` error that occurs when deploying to Firebase.

## Cause

This error happens when your Firebase login session has expired. To resolve this, you need to re-authenticate with the Firebase CLI.

## Solution

1.  **Open a terminal** in the project's root directory (`/Users/carlos/Plan_Working`).

2.  **Run the re-authentication command:**

    ```bash
    firebase login --reauth
    ```

3.  **Follow the on-screen instructions** to log in to your Google account in the browser.

4.  Once you have successfully logged in, you can run the deployment script again:

    ```bash
    ./infra/scripts/deploy.sh