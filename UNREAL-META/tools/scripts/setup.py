#!/usr/bin/env python3
"""
Quest Dev Copilot - Setup Script

This script initializes the development environment and knowledge base.
Run this after cloning the repository and installing dependencies.
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import List, Dict

def check_python_version():
    """Ensure Python 3.9+ is being used"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'flask', 'requests', 'click', 'rich', 'python-dotenv',
        'beautifulsoup4', 'aiohttp'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install'
        ] + missing_packages)

def create_env_file():
    """Create .env file from template if it doesn't exist"""
    env_path = Path('.env')
    example_path = Path('.env.example')
    
    if env_path.exists():
        print("✅ .env file already exists")
        return
    
    if not example_path.exists():
        print("❌ .env.example not found")
        return
    
    # Copy example to .env
    with open(example_path, 'r') as f:
        content = f.read()
    
    with open(env_path, 'w') as f:
        f.write(content)
    
    print("✅ Created .env file from template")
    print("⚠️  Please edit .env and add your API keys:")
    print("   - LLAMA_API_KEY")
    print("   - OPENAI_API_KEY")

def create_directories():
    """Create necessary data directories"""
    directories = [
        'data',
        'data/chroma_db',
        'data/scraped_content',
        'data/embeddings',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def initialize_knowledge_base():
    """Initialize the vector database (placeholder)"""
    print("🔄 Initializing knowledge base...")
    
    # TODO: Implement actual knowledge base initialization
    # This would involve:
    # 1. Scraping forum content
    # 2. Processing and chunking documents
    # 3. Generating embeddings
    # 4. Storing in ChromaDB
    
    knowledge_base_path = Path('data/chroma_db')
    if not knowledge_base_path.exists():
        knowledge_base_path.mkdir(parents=True)
    
    # Create a placeholder file to indicate setup
    (knowledge_base_path / '.initialized').touch()
    print("✅ Knowledge base initialized (placeholder)")

def test_cli():
    """Test the CLI tool with sample data"""
    print("🧪 Testing CLI tool...")
    
    sample_log = Path('sample_logs/plugin_conflict.log')
    if not sample_log.exists():
        print("⚠️  Sample log file not found, skipping CLI test")
        return
    
    try:
        # Test basic CLI functionality (dry run)
        result = subprocess.run([
            sys.executable, 'cli/quest_fix.py', 
            str(sample_log), '--help'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ CLI tool is working")
        else:
            print(f"⚠️  CLI test returned non-zero exit code: {result.returncode}")
    
    except Exception as e:
        print(f"⚠️  CLI test failed: {e}")

def check_unreal_plugin():
    """Check if Unreal Engine plugin files are present"""
    plugin_file = Path('QuestCopilot/QuestCopilot.uplugin')
    
    if plugin_file.exists():
        print("✅ Unreal Engine plugin files found")
        print("💡 To install the plugin:")
        print("   1. Copy QuestCopilot/ to your project's Plugins/ directory")
        print("   2. Regenerate project files")
        print("   3. Enable the plugin in UE Editor")
    else:
        print("❌ Unreal Engine plugin files not found")

def print_next_steps():
    """Print instructions for next steps"""
    print("\n" + "="*50)
    print("🎉 Setup completed!")
    print("="*50)
    print("\n📝 Next steps:")
    print("1. Edit .env file with your API keys")
    print("2. Start the backend server:")
    print("   python backend/app.py")
    print("3. Test the CLI tool:")
    print("   python cli/quest_fix.py sample_logs/plugin_conflict.log")
    print("4. Install the Unreal Engine plugin (see above)")
    print("\n📚 Documentation:")
    print("   - README.md - Project overview")
    print("   - docs/ - Detailed documentation")
    print("   - .cursorrules - AI coding guidelines")

def main():
    """Main setup function"""
    print("🚀 Quest Dev Copilot Setup")
    print("="*30)
    
    try:
        check_python_version()
        check_dependencies()
        create_env_file()
        create_directories()
        initialize_knowledge_base()
        test_cli()
        check_unreal_plugin()
        print_next_steps()
        
    except KeyboardInterrupt:
        print("\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()