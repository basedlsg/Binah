import structlog
from typing import List, Dict, Optional, Any

from .embeddings import GeminiEmbeddingGenerator, TASK_TYPE_RETRIEVAL_QUERY # Import specific task type
from .vector_store import ChromaVectorStore # Relative import

logger = structlog.get_logger(__name__)

class DocumentRetriever:
    """
    Retrieves relevant documents from the vector store based on a query.
    """
    def __init__(self, embedding_generator: GeminiEmbeddingGenerator, vector_store: ChromaVectorStore):
        """
        Initializes the DocumentRetriever.

        Args:
            embedding_generator: An instance of GeminiEmbeddingGenerator.
            vector_store: An instance of ChromaVectorStore.
        """
        self.embedding_generator = embedding_generator
        self.vector_store = vector_store
        logger.info("DocumentRetriever initialized.")

    async def retrieve_relevant_documents(
        self,
        query_text: str,
        n_results: int = 5,
        where_filter: Optional[Dict] = None,
        where_document_filter: Optional[Dict] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieves relevant documents for a given query text.

        Args:
            query_text: The text to search for.
            n_results: The number of results to return.
            where_filter: Optional metadata filter for the ChromaDB query.
            where_document_filter: Optional document content filter for the ChromaDB query.

        Returns:
            A list of retrieved documents with their metadata and scores, or None on error.
            Each item in the list could be a dictionary like:
            {'id': str, 'document': str, 'metadata': dict, 'distance': float}
        """
        if not query_text:
            logger.warning("Query text is empty, cannot retrieve documents.")
            return []

        logger.info("Generating embedding for query", query_text=query_text)
        
        # For querying, the task_type in Gemini might be "RETRIEVAL_QUERY" or "SEMANTIC_SIMILARITY"
        # The GeminiEmbeddingGenerator currently uses "RETRIEVAL_DOCUMENT" for both generate_embedding and generate_embeddings.
        # This might need adjustment. For now, we use the existing method.
        # Ideally, we might want a specific method or parameter in GeminiEmbeddingGenerator for query-type embeddings.
        query_embedding = await self.embedding_generator.generate_embedding(
            text=query_text,
            task_type=TASK_TYPE_RETRIEVAL_QUERY # Explicitly set task type for query
        )

        if not query_embedding:
            logger.error("Failed to generate embedding for query", query_text=query_text)
            return None

        logger.info("Querying vector store", n_results=n_results)
        query_results = self.vector_store.query(
            query_embeddings=[query_embedding], # ChromaDB expects a list of embeddings
            n_results=n_results,
            where=where_filter,
            where_document=where_document_filter
        )

        if not query_results:
            logger.error("Failed to retrieve documents from vector store.")
            return None

        # Process results into a more usable format
        # ChromaDB query results are dictionaries of lists: e.g., {'ids': [[id1, id2]], 'documents': [[doc1, doc2]], ...}
        # Since we query with one embedding, we are interested in the first element of these lists.
        formatted_results = []
        try:
            ids = query_results.get('ids', [[]])[0]
            documents = query_results.get('documents', [[]])[0]
            metadatas = query_results.get('metadatas', [[]])[0]
            distances = query_results.get('distances', [[]])[0]

            for i in range(len(ids)):
                formatted_results.append({
                    "id": ids[i],
                    "document": documents[i] if documents and i < len(documents) else None,
                    "metadata": metadatas[i] if metadatas and i < len(metadatas) else None,
                    "distance": distances[i] if distances and i < len(distances) else None,
                })
            
            logger.info(f"Retrieved {len(formatted_results)} documents.", query_text=query_text)
            return formatted_results
            
        except IndexError:
            logger.error("Mismatch in lengths of arrays in ChromaDB query result", raw_results=query_results)
            return [] # Return empty list if results are malformed for the single query case
        except Exception as e:
            logger.error("Error processing query results", error=str(e), raw_results=query_results, exc_info=True)
            return None

if __name__ == '__main__':
    # This is an example, it requires .env setup and a populated ChromaDB.
    import asyncio
    import os
    from dotenv import load_dotenv

    # Make sure .env is loaded from the project root for standalone execution
    # The relative paths in embeddings.py and vector_store.py for .env loading might need adjustment
    # if this script is run directly and they expect to be in specific subdirectories.
    # For this example, let's assume .env is in ../.env relative to this file (i.e., project root)
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
        print(f"Loaded .env from {dotenv_path}")
    else:
        print(f".env file not found at {dotenv_path}. Make sure it exists for the example to run.")

    async def main_retriever():
        if not os.getenv('GEMINI_API_KEY'):
            print("GEMINI_API_KEY not found in environment. Please set it in your .env file.")
            return

        # 1. Initialize components
        try:
            gemini_embedder = GeminiEmbeddingGenerator()
            # Ensure CHROMA_DB_PATH is set or defaults correctly for ChromaVectorStore
            # Assuming .env is in ../ relative to this file for the example
            chroma_db_path_env = os.getenv("CHROMA_DB_PATH")
            if not chroma_db_path_env:
                 # Default path relative to project root if rag/ is a direct subdir of project root
                chroma_db_path_env = os.path.join(os.path.dirname(__file__), '..', "chroma_db_store_retriever_example")
                print(f"CHROMA_DB_PATH not in .env, using default for example: {chroma_db_path_env}")
            else:
                # If CHROMA_DB_PATH is relative, make it absolute from project root for consistency
                if not os.path.isabs(chroma_db_path_env):
                    chroma_db_path_env = os.path.join(os.path.dirname(__file__), '..', chroma_db_path_env)
            
            print(f"Using ChromaDB path for retriever example: {os.path.abspath(chroma_db_path_env)}")
            # Use a different collection for this example to avoid conflicts with app.py's default
            vector_db = ChromaVectorStore(path=chroma_db_path_env, collection_name="retriever_example_collection")
        except Exception as e:
            print(f"Error during initialization: {e}")
            return

        retriever = DocumentRetriever(embedding_generator=gemini_embedder, vector_store=vector_db)

        # 2. (Optional) Add some sample data if the collection is empty
        if vector_db.get_collection_count() == 0:
            print("Populating sample data into ChromaDB for retriever test...")
            sample_docs = [
                "The UCLASS macro exposes a C++ class to the Unreal Engine reflection system.",
                "Common issues with Quest VR app crashing include memory leaks and unhandled exceptions.",
                "Ensure your Android SDK and NDK are correctly configured for Quest development.",
                "Llama models can be used for text generation and classification tasks."
            ]
            sample_metadatas = [
                {"source": "Unreal Engine Documentation", "topic": "UCLASS"},
                {"source": "VR Developer Forum", "topic": "Quest Crashes"},
                {"source": "Oculus Developer Guide", "topic": "Quest Setup"},
                {"source": "AI Research Paper", "topic": "Llama Models"}
            ]
            sample_ids = ["doc_ue_1", "doc_vr_1", "doc_oculus_1", "doc_ai_1"]
            
            sample_embeddings = await gemini_embedder.generate_embeddings(sample_docs, task_type=TASK_TYPE_RETRIEVAL_DOCUMENT)
            if sample_embeddings:
                vector_db.add_documents(
                    documents=sample_docs, 
                    embeddings=sample_embeddings, 
                    metadatas=sample_metadatas, 
                    ids=sample_ids
                )
                print(f"Added {len(sample_docs)} documents to '{vector_db.collection_name}'. Count: {vector_db.get_collection_count()}")
            else:
                print("Failed to generate embeddings for sample docs. Skipping population.")
        else:
            print(f"Collection '{vector_db.collection_name}' already has {vector_db.get_collection_count()} documents.")

        # 3. Perform a query
        query = "How do I use UCLASS in Unreal?"
        print(f"\nPerforming retrieval for query: '{query}'")
        retrieved_docs = await retriever.retrieve_relevant_documents(query, n_results=2)

        if retrieved_docs is not None:
            print(f"Retrieved {len(retrieved_docs)} documents:")
            for i, doc_info in enumerate(retrieved_docs):
                print(f"  Result {i+1}:")
                print(f"    ID: {doc_info.get('id')}")
                print(f"    Distance: {doc_info.get('distance')}")
                print(f"    Document: {doc_info.get('document')[:100]}...") # Print snippet
                print(f"    Metadata: {doc_info.get('metadata')}")
        else:
            print("Document retrieval failed.")
        
        # 4. Cleanup (optional - clears the test collection)
        # print(f"\nCleaning up collection '{vector_db.collection_name}'...")
        # vector_db.clear_collection()
        # print("Cleanup complete.")

    if __name__ == '__main__':
        asyncio.run(main_retriever()) 