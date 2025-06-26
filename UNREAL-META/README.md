# Quest Dev Copilot

**AI-Powered Debugging Assistant for Unreal Engine Quest VR Development**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Unreal Engine](https://img.shields.io/badge/Unreal%20Engine-5.3%2B-blue.svg)](https://unrealengine.com/)
[![Platform](https://img.shields.io/badge/Platform-Quest%202%2F3-green.svg)](https://www.meta.com/quest/)

Quest Dev Copilot is a comprehensive AI-powered debugging assistant specifically designed for Unreal Engine Quest VR development. It combines advanced AI analysis, offline pattern matching, and intelligent caching to provide developers with instant, accurate solutions to common Quest development challenges.

## ✨ Key Features

- **🤖 AI-Powered Analysis**: Advanced error classification and solution generation using Llama API
- **🔍 VR-Specific Pattern Matching**: 12+ specialized error patterns for Quest development
- **⚡ Intelligent Caching**: 90%+ cache hit rates with persistent storage
- **��️ Security First**: Content sanitization and secure data handling
- **📱 Offline Capabilities**: Graceful degradation when network is unavailable
- **🎯 Performance Optimized**: Memory-efficient design for Quest hardware constraints
- **🔧 Unreal Engine Integration**: Native plugin with professional Slate UI

## 🏗️ Architecture

```
Quest Dev Copilot/
├── QuestCopilot/           # Unreal Engine Plugin
│   ├── Source/             # C++ plugin source code
│   ├── Resources/          # Plugin assets and icons
│   └── QuestCopilot.uplugin
├── src/                    # Backend Services
│   ├── backend/            # Flask API server
│   ├── shared/             # Shared libraries (RAG, Llama, Data)
│   └── frontend/           # Future web interface
├── docs/                   # Documentation
├── tools/                  # CLI tools and scripts
├── tests/                  # Test suites
└── examples/               # Usage examples
```

## 🚀 Quick Start

### Prerequisites

- **Unreal Engine 5.3+**
- **Quest Development SDK**
- **Python 3.8+** (for backend services)
- **Docker** (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/quest-dev-copilot.git
   cd quest-dev-copilot
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Install the Unreal Engine Plugin**
   - Copy `QuestCopilot/` to your project's `Plugins/` directory
   - Enable the plugin in your project settings
   - Restart Unreal Engine

### Usage

1. **Start the backend service**
   ```bash
   make run-backend
   ```

2. **Open Quest Dev Copilot in Unreal Engine**
   - Go to `Window > Quest Dev Copilot`
   - Paste your log content or use auto-detection
   - Click "Analyze Logs" for AI-powered analysis

3. **CLI Usage** (optional)
   ```bash
   python tools/cli/quest_fix.py --log-file your_log.txt
   ```

## 🎯 Core Components

### Unreal Engine Plugin
- **Native C++ Implementation**: High-performance Slate UI integration
- **Modular Architecture**: Separate components for different functionalities
- **Security Manager**: Data sanitization and secure transmission
- **Performance Manager**: Intelligent caching and memory optimization
- **Offline Analyzer**: VR-specific pattern matching engine

### Backend Services
- **Flask API**: RESTful endpoints for log analysis
- **RAG System**: ChromaDB-powered knowledge retrieval
- **Llama Integration**: Advanced AI analysis using Llama models
- **Data Pipeline**: Forum scraping and knowledge base management

## 📚 Documentation

- **[Plugin Guide](docs/plugin-guide.md)** - Complete Unreal Engine plugin documentation
- **[API Reference](docs/api.md)** - Backend API endpoints and usage
- **[CLI Usage](docs/cli-usage.md)** - Command-line interface documentation
- **[Development Guide](docs/development-timeline.md)** - Contributing and development setup

## 🔧 Development

### Project Structure

```
src/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── routes/             # API route definitions
│   └── models/             # Data models
├── shared/
│   ├── llama/              # Llama API integration
│   ├── rag/                # RAG system components
│   ├── crawler/            # Forum scraping
│   └── data/               # Data processing utilities
```

## 📄 License

This project is licensed under the MIT License.

---

**Quest Dev Copilot** - Empowering Quest VR developers with AI-powered debugging assistance.

*Built with ❤️ for the Quest VR development community*
