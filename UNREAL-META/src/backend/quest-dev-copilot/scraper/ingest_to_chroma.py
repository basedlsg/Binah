# scraper/ingest_to_chroma.py
import json
from pathlib import Path
from typing import List, Dict
import structlog
from dataclasses import dataclass
import sys
import os
import asyncio # For running async methods
import hashlib # For generating fallback IDs
import time      # For fallback IDs
from datetime import datetime # For fallback post_date

# Add parent directory to path to import from our modules
# This allows running this script directly from the scraper directory
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
sys.path.append(str(PROJECT_DIR))

from rag.embeddings import GeminiEmbeddingGenerator, TASK_TYPE_RETRIEVAL_DOCUMENT
from rag.vector_store import ChromaVectorStore

logger = structlog.get_logger(__name__)

@dataclass
class DocumentChunk:
    """Represents a chunk of a document ready for embedding"""
    id: str
    content: str
    metadata: Dict

class DataIngestionPipeline:
    """Processes scraped forum data and loads it into ChromaDB"""
    
    def __init__(self, chroma_path: str):
        logger.info("Initializing DataIngestionPipeline...", chroma_db_path=chroma_path)
        # GeminiEmbeddingGenerator loads API key from environment automatically
        self.embedding_generator = GeminiEmbeddingGenerator()
        # ChromaVectorStore uses 'path' argument for persistence directory
        # Ensure a consistent collection name for data.
        self.vector_store = ChromaVectorStore(path=chroma_path, collection_name="unreal_quest_forum_data_v1")
        logger.info("DataIngestionPipeline initialized successfully.", chroma_db_path=chroma_path, collection_name=self.vector_store.collection_name)
        
    async def ingest_forum_posts(self, json_file_path: str, chunk_size: int = 1000, chunk_overlap: int = 200):
        logger.info("Starting ingestion of forum posts from file", file_path=json_file_path)
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
            logger.info("Successfully loaded posts from JSON file", num_posts=len(posts), file_path=json_file_path)
        except FileNotFoundError:
            logger.error("JSON file not found for ingestion. Please check the path.", file_path=json_file_path); return
        except json.JSONDecodeError as e:
            logger.error("Error decoding JSON from file. The file might be corrupted.", file_path=json_file_path, error_details=str(e)); return
        except Exception as e:
            logger.error("An unexpected error occurred while loading posts from file.", file_path=json_file_path, error=str(e), exc_info=True); return

        if not isinstance(posts, list):
            logger.error("Invalid JSON format: Expected a list of posts.", file_path=json_file_path, data_type=type(posts).__name__); return

        all_chunks: List[DocumentChunk] = []
        for i, post_data in enumerate(posts):
            if not isinstance(post_data, dict):
                logger.warning("Skipping invalid post data (expected dict, got something else)", post_index=i, data_type=type(post_data).__name__); continue
            chunks_from_post = self._chunk_post(post_data, chunk_size, chunk_overlap)
            all_chunks.extend(chunks_from_post)
        
        logger.info("Total document chunks created for ingestion", total_chunks=len(all_chunks))
        if not all_chunks: logger.warning("No processable chunks created. Nothing to ingest."); return

        batch_size = int(os.getenv("INGEST_BATCH_SIZE", "32")) # Gemini API batch limit for embeddings is 100.
        total_batches = (len(all_chunks) + batch_size - 1) // batch_size
        logger.info("Starting batch processing of chunks...", total_batches=total_batches, batch_size=batch_size)
        
        for i in range(0, len(all_chunks), batch_size):
            batch_chunks = all_chunks[i:i+batch_size]
            current_batch_num = (i // batch_size) + 1
            logger.info("Processing batch", batch_num=current_batch_num, total_batches=total_batches, num_chunks=len(batch_chunks))
            try: await self._process_batch(batch_chunks)
            except Exception as e_batch:
                logger.error("Critical error processing batch. Continuing with next batch if any.", batch_num=current_batch_num, error=str(e_batch), exc_info=True)
        logger.info("Finished processing all batches.", total_chunks_attempted=len(all_chunks))
    
    def _chunk_post(self, post: Dict, chunk_size: int, chunk_overlap: int) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        raw_content = post.get('content', '')
        post_id = post.get('id', f"autogenid_{hashlib.md5(post.get('url', str(time.time_ns())).encode()).hexdigest()[:10]}")
        post_title = post.get('title', 'Untitled Post')
        post_url = post.get('url', 'URL not available')
        post_forum = post.get('forum', 'unknown_forum')
        post_error_type = post.get('error_type', 'other')
        post_has_solution = post.get('has_solution', False)
        post_date_scraped = post.get('date_scraped', datetime.now().isoformat())
        post_original_date = post.get('post_date', post_date_scraped)

        if post_has_solution and post.get('solution_content'):
            solution_text = post['solution_content']
            if solution_text and solution_text.strip():
                solution_chunk_id = f"{post_id}_solution_0"
                solution_chunk_content = f"SOLUTION for post titled '{post_title}' from {post_url}:\n{solution_text}"
                solution_metadata = {'source_url': post_url, 'forum': post_forum, 'error_type': post_error_type, 'has_solution': True, 'chunk_type': 'solution', 'title': post_title, 'post_date': post_original_date, 'original_id': post_id}
                chunks.append(DocumentChunk(id=solution_chunk_id, content=solution_chunk_content, metadata=solution_metadata))
                logger.debug("Created solution chunk", chunk_id=solution_chunk_id, post_id=post_id)

        if not raw_content or not raw_content.strip():
            logger.debug("Post has no main content to chunk.", post_id=post_id, title=post_title)
            if not chunks: logger.warning("Skipping post with no main content and no solution chunk.", post_id=post_id, title=post_title)
            return chunks

        current_pos = 0; chunk_idx = 0
        while current_pos < len(raw_content):
            end_pos = current_pos + chunk_size
            chunk_text_segment = raw_content[current_pos:end_pos]
            contextual_chunk_text = f"From post titled '{post_title}' ({post_url}):\n{chunk_text_segment}" if chunk_idx == 0 else chunk_text_segment
            chunk_id = f"{post_id}_content_{chunk_idx}"
            content_metadata = {'source_url': post_url, 'forum': post_forum, 'error_type': post_error_type, 'has_solution': post_has_solution, 'chunk_type': 'content', 'chunk_index': chunk_idx, 'title': post_title, 'post_date': post_original_date, 'original_id': post_id}
            chunks.append(DocumentChunk(id=chunk_id, content=contextual_chunk_text, metadata=content_metadata))
            logger.debug("Created content chunk", chunk_id=chunk_id, post_id=post_id, chunk_idx=chunk_idx)
            chunk_idx += 1
            if end_pos >= len(raw_content): break
            current_pos += (chunk_size - chunk_overlap)
            if current_pos >= len(raw_content) and (len(raw_content) - current_pos) < (chunk_overlap / 4): break # Avoid very small trailing chunks
        return chunks
    
    async def _process_batch(self, chunks: List[DocumentChunk]):
        if not chunks: logger.info("Empty chunk batch received, skipping processing."); return
        texts_to_embed = [chunk.content for chunk in chunks]
        logger.info("Generating embeddings for current batch", num_texts=len(texts_to_embed))
        embeddings = await self.embedding_generator.generate_embeddings(texts_to_embed, task_type=TASK_TYPE_RETRIEVAL_DOCUMENT)
        if not embeddings or len(embeddings) != len(texts_to_embed):
            logger.error("Embeddings generation failed or returned mismatched count for batch.", expected_count=len(texts_to_embed), received_count=len(embeddings) if embeddings else 0); return
        doc_ids = [chunk.id for chunk in chunks]; doc_metadatas = [chunk.metadata for chunk in chunks]
        logger.info("Adding documents with embeddings to vector store", num_documents=len(texts_to_embed))
        success = self.vector_store.add_documents(ids=doc_ids, documents=texts_to_embed, embeddings=embeddings, metadatas=doc_metadatas)
        if success: logger.info("Batch successfully added to ChromaDB.", num_added=len(texts_to_embed), first_id=doc_ids[0] if doc_ids else "N/A")
        else: logger.error("Failed to add batch to ChromaDB.", first_id_in_batch=doc_ids[0] if doc_ids else "N/A")

async def run_ingestion_pipeline_cli():
    import argparse
    from dotenv import load_dotenv
    project_root_env_path = PROJECT_DIR / '.env'
    if project_root_env_path.exists(): load_dotenv(dotenv_path=project_root_env_path); logger.info("Loaded .env from project root.", path=str(project_root_env_path))
    else: logger.warning(".env file not found at project root. Ensure GEMINI_API_KEY is set in environment.", checked_path=str(project_root_env_path))
    
    parser = argparse.ArgumentParser(description='Ingest scraped forum posts (JSON) into ChromaDB.')
    parser.add_argument('json_file', type=str, help='Path to the JSON file containing scraped forum posts.')
    parser.add_argument('--chroma-path', type=str, default=os.getenv("CHROMA_DB_PATH", str(PROJECT_DIR / "chroma_db_store")),
                        help='Path to ChromaDB storage directory. Default: CHROMA_DB_PATH env var or ./chroma_db_store in project root.')
    parser.add_argument('--chunk-size', type=int, default=1000, help='Target size of text chunks (default: 1000 chars).')
    parser.add_argument('--chunk-overlap', type=int, default=200, help='Overlap between text chunks (default: 200 chars).')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose INFO level logging.')
    args = parser.parse_args()
    
    # Configure logging level based on verbosity
    log_level = "INFO" if args.verbose else "WARNING"
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True)
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    # Set the root logger's level
    import logging
    logging.basicConfig(level=log_level, stream=sys.stdout, format="%(message)s")

    if not os.getenv('GEMINI_API_KEY'): logger.critical("GEMINI_API_KEY env var not found. Exiting."); return
    logger.info("Starting data ingestion pipeline with CLI args:", **vars(args))
    pipeline = DataIngestionPipeline(chroma_path=args.chroma_path)
    await pipeline.ingest_forum_posts(args.json_file, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)
    logger.info("Data ingestion process finished for file.", file_processed=args.json_file)

if __name__ == "__main__":
    asyncio.run(run_ingestion_pipeline_cli()) 