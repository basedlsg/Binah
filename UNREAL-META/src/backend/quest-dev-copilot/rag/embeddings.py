import os
import google.generativeai as genai
from dotenv import load_dotenv
import structlog
from typing import List, Optional

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

logger = structlog.get_logger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error("Failed to configure Gemini API", error=str(e))
else:
    logger.warning("GEMINI_API_KEY not found in environment. Embedding generation will fail.")

# As per Google's documentation, for generating embeddings.
# Other models include 'embedding-001'
# We should pick one that suits our needs for text embeddings.
# 'text-embedding-004' is the latest as of mid-2024.
DEFAULT_EMBEDDING_MODEL = "text-embedding-004" 

# Supported task types for Gemini embeddings
# See https://ai.google.dev/docs/python_sdk_learn_embeddings
TASK_TYPE_RETRIEVAL_QUERY = "RETRIEVAL_QUERY"
TASK_TYPE_RETRIEVAL_DOCUMENT = "RETRIEVAL_DOCUMENT"
TASK_TYPE_SEMANTIC_SIMILARITY = "SEMANTIC_SIMILARITY"
TASK_TYPE_CLASSIFICATION = "CLASSIFICATION"
TASK_TYPE_CLUSTERING = "CLUSTERING"

class GeminiEmbeddingGenerator:
    """
    Generates text embeddings using the Google Gemini API.
    """
    def __init__(self, model_name: str = DEFAULT_EMBEDDING_MODEL):
        self.model_name = model_name
        if not GEMINI_API_KEY:
            logger.error("Gemini API key not configured. EmbeddingGenerator will not function.")
            # Potentially raise an error here or handle it gracefully depending on desired behavior
            # raise ValueError("GEMINI_API_KEY is not set.")
            
    async def generate_embeddings(self, texts: List[str], task_type: str = TASK_TYPE_RETRIEVAL_DOCUMENT) -> Optional[List[List[float]]]:
        """
        Generates embeddings for a list of texts.

        Args:
            texts: A list of strings to embed.
            task_type: The task type for the embedding. Defaults to RETRIEVAL_DOCUMENT.
                       Options include: RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY, etc.

        Returns:
            A list of embeddings (list of floats), or None if an error occurs.
        """
        if not GEMINI_API_KEY:
            logger.error("Cannot generate embeddings: GEMINI_API_KEY not set.")
            return None
        
        if not texts:
            logger.info("No texts provided for embedding generation.")
            return []

        try:
            # Task type "RETRIEVAL_DOCUMENT" is typically used when embedding documents 
            # for storage and later retrieval.
            # For querying, "RETRIEVAL_QUERY" would be more appropriate.
            result = genai.embed_content(
                model=f"models/{self.model_name}",
                content=texts,  # Pass the list of texts directly
                task_type=task_type
            )
            
            # The result for a batch request is expected to be a dict with an 'embedding' key
            # containing a list of lists (the embeddings for each input text).
            if 'embedding' in result and isinstance(result['embedding'], list):
                # Ensure all elements in the list are also lists (of floats)
                if all(isinstance(e, list) for e in result['embedding']):
                    logger.info(f"Successfully generated {len(result['embedding'])} embeddings using model {self.model_name}.")
                    return result['embedding']
                else:
                    logger.error("Unexpected structure within batch embedding result.", received_embeddings=result['embedding'])
                    return None
            else:
                logger.error("Unexpected embedding result structure for batch", result_structure=result)
                return None

        except Exception as e:
            logger.error(
                "Error generating embeddings with Gemini",
                model=self.model_name,
                num_texts=len(texts),
                task_type_used=task_type,
                error=str(e),
                exc_info=True
            )
            return None

    async def generate_embedding(self, text: str, task_type: str = TASK_TYPE_RETRIEVAL_DOCUMENT) -> Optional[List[float]]:
        """
        Generates an embedding for a single text.

        Args:
            text: The string to embed.
            task_type: The task type for the embedding. Defaults to RETRIEVAL_DOCUMENT.

        Returns:
            An embedding (list of floats), or None if an error occurs.
        """
        if not GEMINI_API_KEY:
            logger.error("Cannot generate embedding: GEMINI_API_KEY not set.")
            return None
        
        if not text:
            logger.info("No text provided for embedding generation.")
            return None
            
        try:
            # Using RETRIEVAL_DOCUMENT for storing documents, RETRIEVAL_QUERY for querying
            result = genai.embed_content(
                model=f"models/{self.model_name}",
                content=text,
                task_type=task_type 
            )
            embedding = result.get('embedding')
            if embedding:
                logger.info(f"Successfully generated embedding using model {self.model_name}.")
                return embedding
            else:
                logger.error("Embedding not found in Gemini API response", response=result)
                return None
        except Exception as e:
            logger.error(
                "Error generating embedding with Gemini",
                model=self.model_name,
                task_type_used=task_type,
                error=str(e),
                exc_info=True
            )
            return None

if __name__ == '__main__':
    # Example usage (requires GEMINI_API_KEY to be set in .env)
    async def main():
        if not GEMINI_API_KEY:
            print("Please set your GEMINI_API_KEY in a .env file in the parent directory.")
            return

        generator = GeminiEmbeddingGenerator()
        
        # Example 1: Single text embedding (for storage)
        sample_text_single = "Unreal Engine a C++ game development framework."
        embedding_single = await generator.generate_embedding(sample_text_single, task_type=TASK_TYPE_RETRIEVAL_DOCUMENT)
        if embedding_single:
            print(f"Embedding for single text (first 5 dims): {embedding_single[:5]}")
            print(f"Embedding dimension: {len(embedding_single)}")
        else:
            print("Failed to generate embedding for single text.")

        print("\n--- Batch Example ---")
        # Example 2: Batch text embedding (for storage)
        sample_texts_batch = [
            "What is a UCLASS in Unreal Engine?",
            "How to fix lighting issues in Quest VR?",
            "Error: LogCompile: Display: Compiler D:/Program Files/Epic Games/UE_5.3/Engine/Source/Runtime/Core/Public/Templates/Tuple.h(384) : fatal error C1001: Internal compiler error."
        ]
        embeddings_batch = await generator.generate_embeddings(sample_texts_batch, task_type=TASK_TYPE_RETRIEVAL_DOCUMENT)
        if embeddings_batch:
            print(f"Generated {len(embeddings_batch)} embeddings for batch.")
            for i, emb in enumerate(embeddings_batch):
                print(f"  Embedding for text {i+1} (first 5 dims): {emb[:5]}")
                print(f"  Embedding dimension: {len(emb)}")
        else:
            print("Failed to generate embeddings for batch.")

        print("\n--- Query Example ---")
        # Example 3: Single text embedding (for query)
        sample_query_text = "Tell me about UCLASS usage."
        query_embedding = await generator.generate_embedding(sample_query_text, task_type=TASK_TYPE_RETRIEVAL_QUERY)
        if query_embedding:
            print(f"Embedding for query text (first 5 dims): {query_embedding[:5]}")
            print(f"Embedding dimension: {len(query_embedding)}")
        else:
            print("Failed to generate embedding for query text.")

    import asyncio
    asyncio.run(main()) 