# Quest Dev Copilot

Quest Dev Copilot is an AI-powered debugging assistant for Unreal Engine Quest VR development. This system combines Retrieval-Augmented Generation (RAG), Llama API integration, Gemini for embeddings, and Unreal Engine plugins to provide intelligent error analysis and potential fixes.

## Project Goals

- Provide intelligent analysis of Unreal Engine logs for Quest VR development.
- Suggest potential fixes and relevant documentation for identified errors.
- Integrate with Unreal Engine via a Slate UI plugin.
- Utilize Llama API for advanced reasoning and Gemini for embeddings.
- Implement a robust backend for processing and a user-friendly CLI.

## Core Technologies

- **AI/ML**: Llama API, Gemini, ChromaDB
- **Backend**: Flask, asyncio/aiohttp, BeautifulSoup
- **Frontend/Client**: Unreal Engine Slate (C++), Rich CLI (Python)
- **Data**: Forum scraping, vector embeddings, JSON processing

## Getting Started

### Prerequisites

- Python 3.9+
- Unreal Engine (Specify Version)
- Access to Llama API
- Access to Google Gemini API

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd quest-dev-copilot
    ```
2.  **Create and populate `.env` file:**
    Copy `.env.example` to `.env` and fill in your API keys and any other necessary environment variables:
    ```bash
    cp .env.example .env
    # Open .env and add your LLAMA_API_KEY and GEMINI_API_KEY
    ```
3.  **Backend Setup:**
    ```bash
    cd backend
    # python -m venv venv
    # source venv/bin/activate (or venv\Scripts\activate on Windows)
    # pip install -r requirements.txt
    # flask run
    ```
    (Detailed backend setup steps will be added here)

4.  **RAG Setup:**
    (Detailed RAG setup and data ingestion steps will be added here)

5.  **Unreal Engine Plugin Setup:**
    (Detailed steps for integrating the plugin will be added here)

6.  **CLI Setup:**
    (Detailed CLI setup steps will be added here)


## Usage

(Usage instructions for the Unreal Engine plugin and CLI will be added here)

## Project Structure

```
quest-dev-copilot/
├── backend/            # Flask backend application
│   ├── app.py          # Main Flask application
│   ├── routes/         # API route definitions
│   ├── models/         # Data models and schemas
│   └── utils/          # Helper functions
├── rag/                # Retrieval-Augmented Generation components
│   ├── vector_store.py # ChromaDB interface
│   ├── embeddings.py   # Embedding utilities (using Gemini)
│   └── retrieval.py    # Document retrieval logic
├── llama/              # Llama API integration
│   ├── client.py       # Main Llama API client
│   ├── models.py       # Response models
│   └── cost_tracker.py # Usage analytics
├── unreal_plugin/      # Unreal Engine Slate plugin (C++)
│   └── ...
├── cli/                # Python Rich CLI
│   └── ...
├── tests/              # Unit and integration tests
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example        # Example environment variables
├── requirements.txt    # Python dependencies for the backend/CLI
└── README.md           # This file
```

## Contributing

(Contribution guidelines will be added here)

## License

(License information will be added here) 