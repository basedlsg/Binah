"""
Fixed Unit tests for RAG retrieval components.
Tests the document retrieval, embedding generation, and context enhancement.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import List, Dict, Any

# Import the modules we're testing
from rag.retrieval import DocumentRetriever
from rag.embeddings import GeminiEmbeddingGenerator
from rag.vector_store import ChromaVectorStore


class TestDocumentRetriever:
    """Test the DocumentRetriever class."""

    @pytest.fixture
    def mock_vector_store(self):
        """Create a mock vector store."""
        mock_store = Mock(spec=ChromaVectorStore)
        mock_store.query = Mock(return_value={
            'documents': [['Sample document content for plugin conflict']],
            'metadatas': [[{'source': 'epic_forums', 'error_type': 'plugin_conflict'}]],
            'distances': [[0.2]],
            'ids': [['doc1']]
        })
        return mock_store

    @pytest.fixture
    def mock_embedding_generator(self):
        """Create a mock embedding generator."""
        mock_gen = Mock(spec=GeminiEmbeddingGenerator)
        mock_gen.generate_embedding = AsyncMock(return_value=[0.1, 0.2, 0.3] * 128)  # 384 dimensions
        return mock_gen

    @pytest.fixture
    def retriever(self, mock_embedding_generator, mock_vector_store):
        """Create a DocumentRetriever instance with mocked dependencies."""
        return DocumentRetriever(embedding_generator=mock_embedding_generator, vector_store=mock_vector_store)

    @pytest.mark.asyncio
    async def test_retrieve_relevant_documents_basic(self, retriever, mock_embedding_generator, mock_vector_store):
        """Test basic document retrieval functionality."""
        query = "Plugin conflict with OculusVR"
        
        # Call the async method properly
        results = await retriever.retrieve_relevant_documents(query)

        # Verify embedding was generated
        mock_embedding_generator.generate_embedding.assert_called_once()
        
        # Verify the vector store query was called correctly
        mock_vector_store.query.assert_called_once()
        call_args = mock_vector_store.query.call_args
        
        # Check the query parameters
        assert call_args.kwargs['n_results'] == 5  # Default value
        assert 'query_embeddings' in call_args.kwargs
        
        # Verify the results format
        assert isinstance(results, list)
        assert len(results) == 1
        assert 'document' in results[0]
        assert 'metadata' in results[0]
        assert 'distance' in results[0]

    @pytest.mark.asyncio
    async def test_retrieve_relevant_documents_with_custom_count(self, retriever, mock_vector_store):
        """Test document retrieval with custom result count."""
        query = "Android SDK mismatch error"
        n_results = 10
        
        results = await retriever.retrieve_relevant_documents(query, n_results=n_results)
        
        # Verify the custom count was passed
        call_args = mock_vector_store.query.call_args
        assert call_args.kwargs['n_results'] == n_results

    @pytest.mark.asyncio
    async def test_retrieve_relevant_documents_with_filter(self, retriever, mock_vector_store):
        """Test document retrieval with metadata filtering."""
        query = "Black screen issue"
        where_filter = {"error_type": {"$eq": "black_screen"}}
        
        results = await retriever.retrieve_relevant_documents(
            query, 
            where_filter=where_filter
        )
        
        # Verify the filter was applied
        call_args = mock_vector_store.query.call_args
        assert call_args.kwargs['where'] == where_filter

    @pytest.mark.asyncio
    async def test_retrieve_relevant_documents_empty_results(self, mock_embedding_generator):
        """Test handling of empty results from vector store."""
        # Mock empty results
        mock_empty_store = Mock(spec=ChromaVectorStore)
        mock_empty_store.query = Mock(return_value={
            'documents': [[]],
            'metadatas': [[]],
            'distances': [[]],
            'ids': [[]]
        })
        
        retriever_empty = DocumentRetriever(embedding_generator=mock_embedding_generator, vector_store=mock_empty_store)
        results = await retriever_empty.retrieve_relevant_documents("test query")
        
        assert results == []

    @pytest.mark.asyncio
    async def test_retrieve_relevant_documents_multiple_results(self, mock_embedding_generator):
        """Test handling of multiple document results."""
        # Mock multiple results
        mock_multi_store = Mock(spec=ChromaVectorStore)
        mock_multi_store.query = Mock(return_value={
            'documents': [['Doc 1 content', 'Doc 2 content']],
            'metadatas': [[
                {'source': 'epic_forums', 'error_type': 'plugin_conflict'},
                {'source': 'meta_forums', 'error_type': 'sdk_mismatch'}
            ]],
            'distances': [[0.1, 0.3]],
            'ids': [['doc1', 'doc2']]
        })
        
        retriever_multi = DocumentRetriever(embedding_generator=mock_embedding_generator, vector_store=mock_multi_store)
        results = await retriever_multi.retrieve_relevant_documents("test query")
        
        assert len(results) == 2
        assert results[0]['document'] == 'Doc 1 content'
        assert results[1]['document'] == 'Doc 2 content'
        assert results[0]['metadata']['error_type'] == 'plugin_conflict'
        assert results[1]['metadata']['error_type'] == 'sdk_mismatch'


class TestGeminiEmbeddingGenerator:
    """Test the GeminiEmbeddingGenerator class."""

    @pytest.fixture
    def embedding_generator(self):
        """Create a GeminiEmbeddingGenerator instance."""
        with patch('rag.embeddings.genai') as mock_genai:
            # Mock the embedding function
            mock_genai.embed_content = Mock(return_value={
                'embedding': [0.1, 0.2, 0.3, 0.4] * 96  # 384 dimensions
            })
            
            generator = GeminiEmbeddingGenerator()
            return generator

    @pytest.mark.asyncio
    async def test_generate_embedding_basic(self, embedding_generator):
        """Test basic embedding generation."""
        text = "Plugin conflict with OculusVR and MetaXR"
        
        embedding = await embedding_generator.generate_embedding(text)
        
        assert isinstance(embedding, list)
        assert len(embedding) == 768  # Gemini text-embedding-004 returns 768 dimensions
        assert all(isinstance(x, (int, float)) for x in embedding)

    @pytest.mark.asyncio
    async def test_generate_embedding_empty_text(self, embedding_generator):
        """Test embedding generation with empty text."""
        with patch('rag.embeddings.genai.embed_content') as mock_embed:
            mock_embed.return_value = {'embedding': [0.0] * 384}
            
            embedding = await embedding_generator.generate_embedding("")
            
            # Should return None for empty text based on implementation
            assert embedding is None

    @pytest.mark.asyncio
    async def test_generate_embedding_long_text(self, embedding_generator):
        """Test embedding generation with long text."""
        long_text = "This is a very long error message " * 100
        
        embedding = await embedding_generator.generate_embedding(long_text)
        
        assert isinstance(embedding, list)
        assert len(embedding) == 768

    @pytest.mark.asyncio
    async def test_generate_embedding_with_task_type(self, embedding_generator):
        """Test embedding generation with specific task type."""
        text = "Shader compilation error"
        task_type = "RETRIEVAL_DOCUMENT"
        
        with patch('rag.embeddings.genai.embed_content') as mock_embed:
            mock_embed.return_value = {'embedding': [0.1] * 384}
            
            embedding = await embedding_generator.generate_embedding(text, task_type=task_type)
            
            # Verify the task type was passed
            mock_embed.assert_called_once()
            call_args = mock_embed.call_args
            assert call_args.kwargs['task_type'] == task_type

    @pytest.mark.asyncio
    async def test_generate_embedding_error_handling(self, embedding_generator):
        """Test error handling in embedding generation."""
        with patch('rag.embeddings.genai.embed_content') as mock_embed:
            mock_embed.side_effect = Exception("API Error")
            
            # Should return None on error based on implementation
            result = await embedding_generator.generate_embedding("test text")
            assert result is None


class TestChromaVectorStore:
    """Test the ChromaVectorStore class."""

    @pytest.fixture
    def mock_chroma_client(self):
        """Create a mock ChromaDB client."""
        mock_client = Mock()
        mock_collection = Mock()
        
        # Mock collection methods
        mock_collection.query = Mock(return_value={
            'documents': [['Sample document']],
            'metadatas': [[{'source': 'test'}]],
            'distances': [[0.1]]
        })
        mock_collection.add = Mock()
        mock_collection.count = Mock(return_value=100)
        
        mock_client.get_or_create_collection = Mock(return_value=mock_collection)
        
        return mock_client, mock_collection

    @pytest.fixture
    def vector_store(self, mock_chroma_client):
        """Create a ChromaVectorStore instance with mocked ChromaDB."""
        mock_client, mock_collection = mock_chroma_client
        
        with patch('rag.vector_store.chromadb.PersistentClient') as mock_chromadb:
            mock_chromadb.return_value = mock_client
            
            store = ChromaVectorStore()
            store.collection = mock_collection
            return store, mock_collection

    def test_query_basic(self, vector_store):
        """Test basic vector store querying."""
        store, mock_collection = vector_store
        
        query_embeddings = [[0.1, 0.2, 0.3] * 128]  # 384 dimensions
        results = store.query(query_embeddings=query_embeddings, n_results=5)
        
        mock_collection.query.assert_called_once_with(
            query_embeddings=query_embeddings,
            n_results=5,
            where=None,
            where_document=None,
            include=['documents', 'distances', 'metadatas']
        )
        
        assert 'documents' in results
        assert 'metadatas' in results
        assert 'distances' in results

    def test_query_with_filter(self, vector_store):
        """Test vector store querying with metadata filter."""
        store, mock_collection = vector_store
        
        query_embeddings = [[0.1, 0.2, 0.3] * 128]  # 384 dimensions
        where_filter = {"error_type": {"$eq": "sdk_mismatch"}}
        
        results = store.query(
            query_embeddings=query_embeddings,
            n_results=3,
            where=where_filter
        )
        
        mock_collection.query.assert_called_once_with(
            query_embeddings=query_embeddings,
            n_results=3,
            where=where_filter,
            where_document=None,
            include=['documents', 'distances', 'metadatas']
        )

    def test_add_documents(self, vector_store):
        """Test adding documents to vector store."""
        store, mock_collection = vector_store
        
        documents = ["Test document content"]
        embeddings = [[0.1, 0.2, 0.3] * 128]  # 384 dimensions
        metadatas = [{"source": "test", "error_type": "test_error"}]
        ids = ["doc_1"]
        
        store.add_documents(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        mock_collection.add.assert_called_once_with(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def test_get_collection_count(self, vector_store):
        """Test getting collection document count."""
        store, mock_collection = vector_store
        
        count = store.get_collection_count()
        
        mock_collection.count.assert_called_once()
        assert count == 100


# Integration test for the complete RAG pipeline
class TestRAGIntegration:
    """Integration tests for the complete RAG pipeline."""

    @pytest.mark.asyncio
    async def test_end_to_end_retrieval_pipeline(self):
        """Test the complete RAG retrieval pipeline."""
        # Mock all components
        mock_embedding_generator = Mock(spec=GeminiEmbeddingGenerator)
        mock_embedding_generator.generate_embedding = AsyncMock(return_value=[0.1, 0.2, 0.3] * 128)
        
        mock_vector_store = Mock(spec=ChromaVectorStore)
        mock_vector_store.query = Mock(return_value={
            'documents': [['Plugin conflict solution: Disable OculusVR and enable MetaXR']],
            'metadatas': [[{'source': 'epic_forums', 'error_type': 'plugin_conflict', 'confidence': 0.95}]],
            'distances': [[0.15]],
            'ids': [['doc1']]
        })
        
        # Create retriever with mocked dependencies
        retriever = DocumentRetriever(embedding_generator=mock_embedding_generator, vector_store=mock_vector_store)
        
        # Test the complete pipeline
        query = "OculusVR plugin conflict with MetaXR"
        results = await retriever.retrieve_relevant_documents(query, n_results=3)
        
        # Verify the pipeline worked end-to-end
        assert len(results) == 1
        assert 'Plugin conflict solution' in results[0]['document']
        assert results[0]['metadata']['error_type'] == 'plugin_conflict'
        assert results[0]['metadata']['confidence'] == 0.95
        assert results[0]['distance'] == 0.15

    @pytest.mark.asyncio
    async def test_error_classification_retrieval(self):
        """Test retrieval for different error types."""
        error_types = ['plugin_conflict', 'sdk_mismatch', 'black_screen', 'packaging_error', 'shader_compile']
        
        for error_type in error_types:
            mock_embedding_generator = Mock(spec=GeminiEmbeddingGenerator)
            mock_embedding_generator.generate_embedding = AsyncMock(return_value=[0.1, 0.2, 0.3] * 128)
            
            mock_vector_store = Mock(spec=ChromaVectorStore)
            mock_vector_store.query = Mock(return_value={
                'documents': [[f'Solution for {error_type} error']],
                'metadatas': [[{'source': 'forums', 'error_type': error_type}]],
                'distances': [[0.2]],
                'ids': [['doc1']]
            })
            
            retriever = DocumentRetriever(embedding_generator=mock_embedding_generator, vector_store=mock_vector_store)
            results = await retriever.retrieve_relevant_documents(
                f"Help with {error_type}",
                where_filter={"error_type": {"$eq": error_type}}
            )
            
            assert len(results) == 1
            assert error_type in results[0]['document']
            assert results[0]['metadata']['error_type'] == error_type 