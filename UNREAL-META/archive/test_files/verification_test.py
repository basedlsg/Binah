#!/usr/bin/env python3
"""
Objective verification of Quest Dev Copilot claims vs reality
"""

import asyncio
import sys
from pathlib import Path
import os
import structlog
from dotenv import load_dotenv

# Configure logging
logger = structlog.get_logger()

# Add the quest-dev-copilot directory to Python path
project_root = Path(__file__).parent
quest_copilot_dir = project_root / "quest-dev-copilot"
sys.path.insert(0, str(quest_copilot_dir))

# Now we can import normally, and relative imports within the modules will work
from backend.real_error_analyzer import RealErrorAnalyzer
from rag.retrieval import DocumentRetriever
from rag.embeddings import GeminiEmbeddingGenerator
from rag.vector_store import ChromaVectorStore

async def verify_rag_pipeline(sample_log_content: str):
    """
    Verifies the full RAG pipeline:
    1. Analyzes a log to classify the error.
    2. Retrieves relevant documents from ChromaDB based on the analysis.
    3. Prints the results.
    """
    logger.info("Starting RAG pipeline verification...")

    # 1. Analyze the error log
    logger.info("Step 1: Analyzing error log...")
    analyzer = RealErrorAnalyzer()
    analysis_result = analyzer.analyze_error_log(sample_log_content)
    
    if not analysis_result or analysis_result['error_type'] == 'unknown':
        logger.error("Could not classify the error log.", log_content=sample_log_content)
        return

    logger.info("Error analysis complete.", result=analysis_result)
    
    query = f"{analysis_result['error_type']}: {analysis_result.get('context', sample_log_content)}"

    # 2. Set up retrieval components
    logger.info("Step 2: Setting up retrieval components...")
    
    try:
        # Initialize embedding generator
        embedding_generator = GeminiEmbeddingGenerator()
        
        # Initialize vector store with the ChromaDB from the root directory (not quest-dev-copilot subdirectory)
        db_path = str(project_root / "chroma_db_store")
        vector_store = ChromaVectorStore(path=db_path, collection_name="unreal_quest_forum_data_v1")
        
        # Initialize document retriever
        retriever = DocumentRetriever(embedding_generator=embedding_generator, vector_store=vector_store)
        
        logger.info("Retrieval components initialized successfully.")
        
    except Exception as e:
        logger.error("Failed to initialize retrieval components.", error=str(e))
        return

    # 3. Retrieve documents
    logger.info("Step 3: Retrieving documents from ChromaDB...", query=query)
    
    try:
        retrieved_docs = await retriever.retrieve_relevant_documents(query, n_results=3)
    except Exception as e:
        logger.error("Failed to retrieve documents from ChromaDB.", error=str(e))
        return

    # 4. Print results
    logger.info("Step 4: Displaying results.")
    print("\n" + "="*80)
    print("      RAG PIPELINE VERIFICATION RESULTS")
    print("="*80)
    print(f"\n[+] Sample Log Content:\n    '{sample_log_content}'")
    print(f"\n[+] Detected Error Type: {analysis_result['error_type']} (Confidence: {analysis_result['confidence']:.2f})")
    print(f"[+] Generated Search Query: '{query}'")
    print("\n" + "-"*80)

    if retrieved_docs:
        print(f"\n[+] Found {len(retrieved_docs)} relevant documents in ChromaDB:\n")
        for i, doc in enumerate(retrieved_docs, 1):
            print(f"  {i}. ID: {doc.get('id', 'N/A')}")
            print(f"     Source: {doc.get('metadata', {}).get('source_url', 'N/A')}")
            print(f"     Title: {doc.get('metadata', {}).get('title', 'N/A')}")
            print(f"     Distance: {doc.get('distance', 'N/A')}")
            print(f"     Content: {doc.get('document', 'N/A')[:200].strip()}...")
            print("-" * 20)
    else:
        print("\n[-] No relevant documents found in ChromaDB.")
    
    print("\n" + "="*80)


async def main():
    # Load environment variables from the quest-dev-copilot directory
    env_path = quest_copilot_dir / '.env'
    
    if not env_path.exists():
        print(f"WARNING: .env file not found at {env_path}. Checking root directory...")
        env_path = project_root / '.env'
        
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"Loaded environment from {env_path}")
    else:
        print("No .env file found. Gemini API key must be in the environment.")
    
    if not os.getenv('GEMINI_API_KEY'):
        print(f"FATAL: GEMINI_API_KEY not found in environment")
        print("Please set the GEMINI_API_KEY environment variable or add it to a .env file")
        return

    # Test 1: Specific VR error
    print("\n" + "="*80)
    print("TEST 1: Specific VR Error")
    print("="*80)
    sample_log = "LogVulkanRHI: Error: Failed to allocate VR eye buffer of size"
    await verify_rag_pipeline(sample_log)
    
    # Test 2: General Quest development query to verify ChromaDB has data
    print("\n" + "="*80)
    print("TEST 2: General Quest Development Query")
    print("="*80)
    await verify_general_query("Quest VR development issues")

async def verify_general_query(query_text: str):
    """
    Test ChromaDB with a general query to verify it contains data.
    """
    logger.info("Testing ChromaDB with general query...", query=query_text)
    
    try:
        # Initialize components
        embedding_generator = GeminiEmbeddingGenerator()
        db_path = str(project_root / "chroma_db_store")
        vector_store = ChromaVectorStore(path=db_path, collection_name="unreal_quest_forum_data_v1")
        retriever = DocumentRetriever(embedding_generator=embedding_generator, vector_store=vector_store)
        
        # Check collection info
        collection_count = vector_store.get_collection_count()
        print(f"\n[+] ChromaDB Collection Info:")
        print(f"    Collection: unreal_quest_forum_data_v1")
        print(f"    Document Count: {collection_count}")
        
        if collection_count == 0:
            print("\n[-] ChromaDB collection is empty!")
            return
        
        # Perform query
        retrieved_docs = await retriever.retrieve_relevant_documents(query_text, n_results=3)
        
        print(f"\n[+] Query: '{query_text}'")
        print("\n" + "-"*60)
        
        if retrieved_docs:
            print(f"\n[+] Found {len(retrieved_docs)} relevant documents:\n")
            for i, doc in enumerate(retrieved_docs, 1):
                print(f"  {i}. ID: {doc.get('id', 'N/A')}")
                print(f"     Source: {doc.get('metadata', {}).get('source_url', 'N/A')}")
                print(f"     Title: {doc.get('metadata', {}).get('title', 'N/A')}")
                print(f"     Distance: {doc.get('distance', 'N/A')}")
                print(f"     Content: {doc.get('document', 'N/A')[:300].strip()}...")
                print("-" * 40)
        else:
            print("\n[-] No relevant documents found.")
            
    except Exception as e:
        logger.error("Failed to perform general query test.", error=str(e))
        print(f"\n[-] Error: {str(e)}")

if __name__ == "__main__":
    # Configure logging
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    
    asyncio.run(main())
