import os
import chromadb
from chromadb.utils import embedding_functions
import structlog
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

logger = structlog.get_logger(__name__)

# --- Configuration ---
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db_store")
DEFAULT_COLLECTION_NAME = "unreal_quest_docs"

class ChromaVectorStore:
    """
    Manages interaction with a ChromaDB vector store.
    """
    def __init__(self, path: str = CHROMA_DB_PATH, collection_name: str = DEFAULT_COLLECTION_NAME, embedding_function: Optional[Any] = None):
        """
        Initializes the ChromaVectorStore.

        Args:
            path: Path to the ChromaDB persistent storage.
            collection_name: Name of the collection to use.
            embedding_function: ChromaDB compatible embedding function. 
                                If None, embeddings must be provided manually when adding documents.
        """
        try:
            self.client = chromadb.PersistentClient(path=path)
            logger.info("ChromaDB persistent client initialized", path=path)
            
            self.collection_name = collection_name
            self.embedding_function = embedding_function
            
            # Create or get the collection
            # If an embedding function is provided to ChromaDB, it will handle embedding generation internally.
            # However, our design uses GeminiEmbeddingGenerator separately.
            # So, we might not pass an embedding_function to the collection if we always provide pre-computed embeddings.
            if self.embedding_function:
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=self.embedding_function
                )
            else:
                 # If we are providing embeddings manually (e.g., from Gemini)
                self.collection = self.client.get_or_create_collection(name=self.collection_name)

            logger.info(f"Using ChromaDB collection '{self.collection_name}'", collection_name=self.collection_name)

        except Exception as e:
            logger.error("Failed to initialize ChromaDB client or collection", error=str(e), exc_info=True)
            # Depending on the application's needs, either raise or handle this.
            # For a critical component like a vector store, raising might be appropriate.
            raise

    def add_documents(
        self,
        documents: List[str],
        embeddings: Optional[List[List[float]]] = None,
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> bool:
        """
        Adds documents to the collection.

        Args:
            documents: List of document texts.
            embeddings: Optional list of pre-computed embeddings. Required if no embedding_function was set for the collection.
            metadatas: Optional list of metadata dictionaries for each document.
            ids: Optional list of unique IDs for each document.

        Returns:
            True if documents were added successfully, False otherwise.
        """
        if not documents:
            logger.warning("No documents provided to add.")
            return False

        if not self.embedding_function and embeddings is None:
            logger.error("Embeddings must be provided if the collection was initialized without an embedding function.")
            return False
        
        if embeddings and len(documents) != len(embeddings):
            logger.error("Number of documents and embeddings must match.")
            return False
        
        if metadatas and len(documents) != len(metadatas):
            logger.error("Number of documents and metadatas must match.")
            return False

        if ids and len(documents) != len(ids):
            logger.error("Number of documents and IDs must match.")
            return False
        
        if not ids:
            # Generate simple sequential IDs if not provided. Consider more robust ID generation for production.
            start_id = self.collection.count() # A simple way to try and get unique IDs.
            ids = [f"doc_{start_id + i}" for i in range(len(documents))]
            logger.info(f"Generated {len(ids)} sequential IDs for new documents.")

        try:
            if embeddings:
                self.collection.add(
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
            elif self.embedding_function: # Should only happen if Chroma handles embedding
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
            else:
                # This case should have been caught earlier, but as a safeguard:
                logger.error("Cannot add documents: No embeddings provided and no collection embedding function.")
                return False
                
            logger.info(f"Successfully added {len(documents)} documents to collection '{self.collection_name}'.")
            return True
        except Exception as e:
            logger.error(
                f"Failed to add documents to collection '{self.collection_name}'", 
                error=str(e), 
                num_documents=len(documents),
                exc_info=True
            )
            return False

    def query(self, query_embeddings: List[List[float]], n_results: int = 5, where: Optional[Dict] = None, where_document: Optional[Dict] = None) -> Optional[Dict[str, List[Any]]]:
        """
        Queries the collection for similar documents based on query embeddings.

        Args:
            query_embeddings: A list of query embeddings.
            n_results: Number of results to return for each query embedding.
            where: Optional metadata filter.
            where_document: Optional document content filter.

        Returns:
            A dictionary containing lists of matching documents, distances, metadatas, etc., or None on error.
            Example: {'ids': [...], 'documents': [...], 'distances': [...], 'metadatas': [...]}
        """
        if not query_embeddings:
            logger.warning("No query embeddings provided.")
            return None
        
        try:
            results = self.collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results,
                where=where,
                where_document=where_document,
                include=['documents', 'distances', 'metadatas'] # Specify what to include in results
            )
            logger.info(f"Query executed successfully, found {len(results.get('ids', [[]])[0]) if results and results.get('ids') else 0} results for the first query embedding.", n_results_requested=n_results)
            return results
        except Exception as e:
            logger.error(
                f"Failed to query collection '{self.collection_name}'", 
                error=str(e), 
                num_query_embeddings=len(query_embeddings),
                exc_info=True
            )
            return None

    def get_collection_count(self) -> int:
        """Returns the number of items in the collection."""
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Failed to get count for collection '{self.collection_name}'", error=str(e), exc_info=True)
            return 0

    def clear_collection(self) -> bool:
        """Deletes all items from the current collection."""
        try:
            collection_name_to_delete = self.collection_name
            # ChromaDB doesn't have a simple clear() on a collection object.
            # We need to delete the collection and recreate it.
            self.client.delete_collection(name=collection_name_to_delete)
            logger.info(f"Successfully deleted collection '{collection_name_to_delete}'.")
            
            # Recreate it
            if self.embedding_function:
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name, # Use self.collection_name to ensure it's the same
                    embedding_function=self.embedding_function
                )
            else:
                self.collection = self.client.get_or_create_collection(name=self.collection_name)
            logger.info(f"Successfully recreated collection '{self.collection_name}'.")
            return True
        except Exception as e:
            logger.error(f"Failed to clear collection '{self.collection_name}'", error=str(e), exc_info=True)
            return False

if __name__ == '__main__':
    # This example assumes you have a running Gemini embedding generator or pre-computed embeddings.
    # For a self-contained ChromaDB example without external embeddings, 
    # you would initialize ChromaVectorStore with a chromadb.utils.embedding_functions like SentenceTransformer.

    print(f"ChromaDB will be stored in: {os.path.abspath(CHROMA_DB_PATH)}")
    
    # Example of using a Chroma-native embedding function (requires pip install sentence-transformers)
    # ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    # vector_store = ChromaVectorStore(collection_name="test_collection_ef", embedding_function=ef)
    # vector_store.add_documents(documents=["This is doc1 with EF", "Another doc with EF"], ids=["ef_doc1", "ef_doc2"])
    # results_ef = vector_store.query(query_texts=["query with EF"], n_results=1)
    # print("Query results with EF:", results_ef)
    # vector_store.clear_collection()
    
    # Example using pre-computed embeddings (how we intend to use it with GeminiEmbeddingGenerator)
    # This part requires an embedding generator setup, so we'll mock embeddings for this standalone test.
    vector_store_manual = ChromaVectorStore(collection_name="test_collection_manual_emb")
    
    # Mock embeddings (replace with actual Gemini embeddings)
    # Dimension for text-embedding-004 is 768
    mock_embeddings = [
        [0.1] * 768, 
        [0.2] * 768, 
        [0.3] * 768
    ]
    mock_documents = [
        "Unreal Engine basics: UCLASS and UPROPERTY",
        "Debugging Quest VR rendering artifacts",
        "Llama API for error classification in logs"
    ]
    mock_metadatas = [
        {"source": "Unreal Docs", "type": "core"},
        {"source": "Quest Forum", "type": "rendering"},
        {"source": "Internal Notes", "type": "ai_integration"}
    ]
    mock_ids = ["doc1", "doc2", "doc3"]

    print(f"Initial count: {vector_store_manual.get_collection_count()}")
    added = vector_store_manual.add_documents(
        documents=mock_documents,
        embeddings=mock_embeddings,
        metadatas=mock_metadatas,
        ids=mock_ids
    )
    print(f"Documents added: {added}")
    print(f"Count after adding: {vector_store_manual.get_collection_count()}")

    if added:
        query_embedding = [[0.15] * 768] # Mock query embedding, similar to doc1/doc2
        results = vector_store_manual.query(query_embeddings=query_embedding, n_results=2)
        if results:
            print("\nQuery Results:")
            print(f"  IDs: {results.get('ids')}")
            print(f"  Documents: {results.get('documents')}")
            print(f"  Distances: {results.get('distances')}")
            print(f"  Metadatas: {results.get('metadatas')}")

    # Cleanup
    print(f"\nClearing collection '{vector_store_manual.collection_name}'...")
    cleared = vector_store_manual.clear_collection()
    print(f"Collection cleared: {cleared}")
    print(f"Count after clearing: {vector_store_manual.get_collection_count()}")

    # Example to show PersistentClient storage:
    # After running this, a folder named "chroma_db_store" (or CHROMA_DB_PATH) 
    # should exist with the database files.
    # If you run it again, it will load from the existing store unless cleared. 