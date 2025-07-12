# Quantum-Visualization: Development & Operations Guide (v1.0)

This document establishes the foundational principles, constraints, and practices for the Quantum-Visualization project. It is a living document, to be updated by the team as we progress through the development lifecycle. All team members are expected to adhere to these guidelines to ensure quality, consistency, and velocity.

## 1. Guiding Principles & Philosophy

-   **Rigor over Speed:** Our primary goal is scientific and engineering excellence. We will always favor a well-tested, robust, and performant solution over a quick-and-dirty one.
-   **Automate Everything:** Every repetitive task—from linting and testing to deployment and data regeneration—must be automated. The CI/CD pipeline is the single source of truth for the project's health.
-   **Insight-Driven Development:** Every feature must trace back to a specific persona and a clear hypothesis about how it will generate new insight. Features without a "why" will not be built.
-   **Constraint-Aware Architecture:** We operate within a defined set of services and a finite budget. Our architectural choices must reflect these constraints, prioritizing cost-effective solutions without compromising the core scientific mission.

## 2. Technical Backend & Service Constraints

Our backend infrastructure is built upon a specific set of managed APIs and cloud services. Understanding their capabilities and limitations is critical for all design and development work.

### 2.1. LLM & Specialized AI APIs

| Service | Key Feature | Core Use Case | Critical Constraints & Cost Factors |
| :--- | :--- | :--- | :--- |
| **Llama API** | **State-of-the-Art Models** | High-quality text generation, complex reasoning, fine-tuning. | - **Rate Limits:** Defined by Requests Per Minute (RPM) and Tokens Per Minute (TPM), which vary by model. Exceeding limits results in HTTP 429 errors.<br>- **Cost:** Priced per token (input and output). Fine-tuning and hosting custom models incur separate charges.<br>- **Data Policy:** Meta does not use API content for training their models. |
| **Groq API** | **Extreme Low Latency** | Real-time, interactive applications where response speed is paramount. | - **Value Prop:** Unmatched tokens/second performance via custom LPU hardware.<br>- **Model Availability:** Serves a curated set of open-source models (e.g., Llama, Mixtral). You cannot use models not explicitly hosted by Groq.<br>- **Cost:** Priced per token. The primary cost-benefit is performance, not necessarily the lowest price-per-token. |
| **Gemini API** | **Advanced Multimodality** | Analyzing and responding to complex inputs combining text, images, audio, and video. | - **Multimodality:** Natively designed for multimodal understanding.<br>- **Rate Limits:** Governed by RPM, RPD, and TPM, with tiered access (Free, Tier 1, etc.) based on billing status and usage history.<br>- **Cost:** Priced per character and per token for input/output, with separate pricing for image/video inputs. |

### 2.2. Google Cloud Platform (GCP) Services

Our project will leverage GCP for its underlying compute, storage, and networking. Cost management is paramount.

| Service | Role in Project | Critical Constraints & Cost Factors |
| :--- | :--- | :--- |
| **Cloud Storage** | **Primary Data Store** | Storing raw datasets (Parquet/CSV), golden images, and Unity build artifacts. | - **Storage Cost:** Low cost per GB/month, varies by storage class (Standard, Nearline, etc.).<br>- **Egress Cost:** **This is a major cost driver.** Data transferred *out* of Cloud Storage to the internet or to a GCP service in another region incurs significant costs. Ingress is free. |
| **Compute Engine** | **Data Generation & CI** | Running data generation scripts (`run.py`), weekly CI jobs, and potentially a dedicated build runner. | - **Instance Cost:** Charged per-second based on machine type (vCPU, RAM).<br>- **GPU Attachment:** GPUs for rendering/testing (e.g., on CI runners) have a high hourly cost.<br>- **Network Egress:** Data sent from a VM to the internet is a primary cost. Data transfer to other VMs in the same region is cheaper. |
| **Cloud Run / Functions** | **Serverless Components (potential)** | Potentially hosting the Python backend for the Plotly/Dash dashboard. | - **Invocation Cost:** Charged per request.<br>- **Compute Time:** Charged for the CPU and memory allocated during execution.<br>- **Cost-Effective:** Scales to zero, making it ideal for services with intermittent traffic. |
| **Cloud Pub/Sub** | **Messaging (potential)** | Alternative to ZeroMQ for the data bridge if a managed service is preferred. | - **Data Volume:** Charged per GiB of message data published and delivered.<br>- **Cost:** Generally low cost, but can add up with high-frequency, high-volume data streams. |

## 3. Cursor-Centric Development Workflow

This project mandates the use of Cursor as the primary development environment. Its AI-native features are not optional extras; they are integral to our workflow.

### 3.1. The "Cursor First" Mentality

-   **Research with `@Codebase` & `@web`:** Before writing new code, an engineer's first step is to understand the context. Use `@Codebase` to ask questions about our existing code ("How is the `ZeroMQ` relay initialized?"). Use `@web` to research best practices ("@web best practices for high-performance python data serialization"). This is logged and auditable.
-   **Generative Scaffolding:** Use the AI chat to generate boilerplate code, test cases, and documentation stubs. For example: "Scaffold a pytest test for `data_fetch.py`. It should use a mock Polars DataFrame and test the edge case of an empty input file."
-   **Terminal as an Action:** All command-line operations (installing dependencies, running tests, compiling protos) should be executed via the integrated terminal (`run_terminal_cmd`). This keeps a verifiable log of all actions taken.
-   **Iterative Refinement with AI:** Use the "Fix & Refine" features to improve code quality. Highlight a function and ask the AI to "add type hints," "improve performance," or "add docstrings in NumPy format."

### 3.2. Model Context Protocol (MCP) and Remote Servers

You've mentioned "MCP servers." While this term isn't a standard industry acronym, interpreting it as a general "Model Context Protocol" suggests a powerful development pattern we will adopt. We will treat our running application components as **live context sources** for the model.

-   **Live Interaction:** An engineer should be able to connect Cursor's AI to a running development server (e.g., the Dash/Plotly backend or the Unity editor).
-   **Hypothetical `mcp_query` Tool:** Imagine a tool `mcp_query(target_server, query_string)`. An engineer could run: `mcp_query('unity_editor', 'get_current_camera_position')`. This is our interpretation of MCP: using the AI to interact with and query the state of live, remote development processes. This is an advanced technique we will explore and potentially build tooling for as part of this project's commitment to cutting-edge development practices. 