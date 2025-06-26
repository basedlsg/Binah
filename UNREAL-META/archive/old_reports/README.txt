# Quest Dev Copilot Plugin

## Description
The Quest Dev Copilot is an AI-powered debugging assistant for Unreal Engine Quest VR development. It helps analyze build errors, runtime logs, and provides intelligent fix suggestions directly within the Unreal Editor. This plugin aims to streamline the debugging process for Meta Quest projects.

## Features
- **In-Editor AI Error Analysis**: Submit logs directly from the UE interface.
- **Contextual Fix Suggestions**: Get potential solutions based on analyzed errors.
- **Slate UI Integration**: A dedicated, dockable tab within the Unreal Editor for detailed analysis.
- **Quick Analysis Context Menus**: Right-click on logs in various UE windows (Output Log, Message Log) to quickly send them for analysis.
- **Screenshot Analysis (Optional)**: Capture a screenshot of the editor and include it with your log analysis request for more context.
- **Configurable Backend URL**: Set the API endpoint for the AI analysis service via Project Settings.

## Setup
1.  **Enable the Plugin**: Ensure "Quest Dev Copilot" is enabled in your project's `Edit > Plugins` menu. Restart Unreal Editor if prompted.
2.  **Configure Backend URL (Crucial)**:
    *   Go to `Edit > Project Settings > Plugins > Quest Dev Copilot`.
    *   Set the "Backend URL" to the address of your running Quest Dev Copilot AI service (e.g., `http://localhost:8000/api` if running locally).
    *   **The plugin WILL NOT FUNCTION without a valid and running backend service.**
3.  **Backend Service**: This plugin requires the Quest Dev Copilot backend service to be running and accessible at the configured URL. Please refer to the separate backend setup documentation for instructions on how to install and run the AI service. *(A link to this documentation should be provided by the plugin distributor).*

## Usage
1.  **Open the Main Interface**:
    *   Access the main Quest Dev Copilot window via `Window > Quest Dev Copilot` in the Unreal Editor menu bar.
    *   You can dock this tab like any other editor window.
2.  **Analyze Logs**:
    *   **Manual Input**: Paste log content directly into the "Log Content" text area in the Quest Copilot tab.
    *   **Refresh Logs**: Click "Refresh Logs" to attempt to automatically load logs from common project log files (e.g., `UnrealBuildTool.log`).
    *   **Screenshot (Optional)**: Click "Capture Screenshot" to take a picture of the current editor state. You can add a description for the screenshot.
    *   Click the "Analyze Error" button.
3.  **Quick Analysis**:
    *   In the Unreal Editor's Output Log, Message Log, or some text editors, select the relevant error text.
    *   Right-click and choose "Analyze with Copilot" (or a similar option).
4.  **Review Results**:
    *   The analysis results, including error classification, confidence, description, and suggested solutions, will appear in the "Analysis Results" section of the Quest Copilot tab.
    *   Quick analysis might show a popup or a notification.

## Backend Service Dependency
**IMPORTANT**: The core functionality of this plugin (AI-powered analysis) is entirely dependent on a separate backend service. This plugin acts as a client interface to that service. You **must** have the backend service running and correctly configured in the Project Settings for this plugin to work.

If you are a user who acquired this plugin, please ensure you have received instructions on how to access or set up the required backend from the plugin provider.

## Support
For support, bug reports, or feature requests, please visit the official support channel (to be specified by the plugin author, e.g., a GitHub Issues page or a dedicated support forum).

**Placeholder Support URL**: `https://example.com/quest-dev-copilot/issues` (Replace this with your actual support URL)

## Known Issues
- Requires a running backend service; does not function standalone for AI analysis.
- Log parsing for "Refresh Logs" might not cover all custom log formats or locations.
- [Add other known issues if any]

## Future Development
- Enhanced log parsing capabilities.
- Direct integration with common Quest SDK error codes.
- Support for more log types.
- [Outline other future plans]

---
Thank you for using Quest Dev Copilot!
Quest Dev Copilot Team
2024 