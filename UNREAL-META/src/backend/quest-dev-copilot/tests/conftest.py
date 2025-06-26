"""
Pytest configuration for Quest Dev Copilot tests.
"""

import sys
from pathlib import Path
import pytest

# It's generally better to handle pathing via editable installs
# or pytest.ini, but since that is failing, we remove this
# to allow tests to be collected.

@pytest.fixture(scope="session")
def sample_error_logs():
    """Provide sample error logs for testing."""
    return {
        'plugin_conflict': 'LogTemp: Error: OpenXR plugin conflicts with MetaXR plugin. Only one XR plugin can be active at a time.',
        'sdk_mismatch': 'Error: Target SDK version 33 is not supported for Quest development. Maximum supported version is 32.',
        'black_screen': 'LogVulkanRHI: Error: Failed to allocate VR eye buffer. Vulkan initialization failed.',
        'packaging_error': 'PackagingResults: Error: BUILD FAILED. AutomationTool exiting with code: 25',
        'shader_compile': 'LogShaders: Error: Shader compilation failed. HLSL error X3004: undeclared identifier'
    }

@pytest.fixture(scope="session") 
def mock_cost_tracker_data():
    """Provide mock cost tracking data for testing."""
    return {
        'usage_records': [
            {
                'timestamp': '2025-06-23T22:00:00Z',
                'model': 'Llama-4-Scout-17B-16E-Instruct-FP8',
                'input_tokens': 100,
                'output_tokens': 50,
                'estimated_cost_usd': 0.0003,
                'operation': 'error_analysis'
            }
        ],
        'total_cost': 0.0003,
        'daily_budget': 10.0
    } 