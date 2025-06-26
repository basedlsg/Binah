"""
Unit tests for the RAG retrieval module.
Tests document retrieval, embedding generation, and ChromaDB operations.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from rag.retrieval import DocumentRetriever
from rag.embeddings import GeminiEmbeddingGenerator
from rag.vector_store import ChromaVectorStore


class TestDocumentRetriever:
    """Test suite for DocumentRetriever."""

    @pytest.fixture
    def mock_embedding_generator(self):
        """Create a mock embedding generator."""
        generator = Mock(spec=GeminiEmbeddingGenerator)
        generator.generate_embedding.return_value = np.random.rand(384).tolist()
        return generator

    @pytest.fixture
    def mock_vector_store(self):
        """Create a mock vector store."""
        store = Mock(spec=ChromaVectorStore)
        store.search.return_value = [
            {
                "id": "doc1",
                "content": "Sample error resolution for plugin conflicts",
                "metadata": {"source": "epic_games_forum", "confidence": 0.95},
                "distance": 0.1
            },
            {
                "id": "doc2", 
                "content": "Another solution for VR development issues",
                "metadata": {"source": "meta_forum", "confidence": 0.87},
                "distance": 0.2
            }
        ]
        return store

    @pytest.fixture
    def retriever(self, mock_embedding_generator, mock_vector_store):
        """Create a document retriever with mocked dependencies."""
        return DocumentRetriever(
            embedding_generator=mock_embedding_generator,
            vector_store=mock_vector_store
        )

    def test_retrieval_success(self, retriever, mock_embedding_generator, mock_vector_store):
        """Test successful document retrieval."""
        query = "Plugin conflict error in Quest VR development"
        
        results = retriever.retrieve_relevant_documents(query, top_k=2)

        # Verify embedding was generated
        mock_embedding_generator.generate_embedding.assert_called_once_with(query)
        
        # Verify vector store search was called
        mock_vector_store.search.assert_called_once()
        
        # Verify results
        assert len(results) == 2
        assert results[0]["content"] == "Sample error resolution for plugin conflicts"
        assert results[0]["metadata"]["confidence"] == 0.95

    def test_retrieval_with_filters(self, retriever, mock_vector_store):
        """Test document retrieval with metadata filters."""
        query = "SDK mismatch error"
        filters = {"source": "epic_games_forum"}
        
        retriever.retrieve_relevant_documents(query, top_k=5, filters=filters)
        
        # Verify filters were passed to vector store
        call_args = mock_vector_store.search.call_args
        assert call_args[1]["filters"] == filters

    def test_retrieval_empty_results(self, retriever, mock_vector_store):
        """Test handling of empty search results."""
        mock_vector_store.search.return_value = []
        
        results = retriever.retrieve_relevant_documents("Nonexistent error")
        
        assert results == []

    def test_retrieval_with_threshold(self, retriever, mock_vector_store):
        """Test filtering results by similarity threshold."""
        # Mock results with varying distances
        mock_vector_store.search.return_value = [
            {"id": "doc1", "content": "Close match", "distance": 0.1},
            {"id": "doc2", "content": "Distant match", "distance": 0.8}
        ]
        
        results = retriever.retrieve_relevant_documents(
            "Test query", 
            similarity_threshold=0.5
        )
        
        # Only the close match should be returned
        assert len(results) == 1
        assert results[0]["content"] == "Close match"

    def test_error_handling_embedding_failure(self, retriever, mock_embedding_generator):
        """Test handling of embedding generation failures."""
        mock_embedding_generator.generate_embedding.side_effect = Exception("API Error")
        
        with pytest.raises(Exception) as exc_info:
            retriever.retrieve_relevant_documents("Test query")
        
        assert "API Error" in str(exc_info.value)

    def test_error_handling_vector_store_failure(self, retriever, mock_vector_store):
        """Test handling of vector store failures."""
        mock_vector_store.search.side_effect = Exception("Database Error")
        
        with pytest.raises(Exception) as exc_info:
            retriever.retrieve_relevant_documents("Test query")
        
        assert "Database Error" in str(exc_info.value)

    def test_context_enhancement(self, retriever):
        """Test context enhancement with retrieved documents."""
        documents = [
            {"content": "Solution A for plugin conflicts", "metadata": {"source": "forum"}},
            {"content": "Solution B for SDK issues", "metadata": {"source": "docs"}}
        ]
        
        enhanced_context = retriever.enhance_context_with_documents(
            original_context="Original error log",
            documents=documents
        )
        
        assert "Original error log" in enhanced_context
        assert "Solution A for plugin conflicts" in enhanced_context
        assert "Solution B for SDK issues" in enhanced_context


class TestGeminiEmbeddingGenerator:
    """Test suite for GeminiEmbeddingGenerator."""

    @pytest.fixture
    def generator(self):
        """Create a Gemini embedding generator."""
        return GeminiEmbeddingGenerator(
            api_key="test_api_key",
            model="models/embedding-001"
        )

    @patch('google.generativeai.embed_content')
    def test_generate_embedding_success(self, mock_embed, generator):
        """Test successful embedding generation."""
        mock_embed.return_value = {
            'embedding': [0.1, 0.2, 0.3, 0.4]
        }
        
        text = "Sample error message for embedding"
        result = generator.generate_embedding(text)
        
        mock_embed.assert_called_once()
        assert result == [0.1, 0.2, 0.3, 0.4]

    @patch('google.generativeai.embed_content')
    def test_generate_embedding_with_task_type(self, mock_embed, generator):
        """Test embedding generation with specific task type."""
        mock_embed.return_value = {'embedding': [0.1, 0.2]}
        
        generator.generate_embedding("Test text", task_type="retrieval_query")
        
        # Verify task type was passed
        call_args = mock_embed.call_args
        assert call_args[1]["task_type"] == "retrieval_query"

    @patch('google.generativeai.embed_content')
    def test_generate_embedding_api_error(self, mock_embed, generator):
        """Test handling of API errors."""
        mock_embed.side_effect = Exception("API quota exceeded")
        
        with pytest.raises(Exception) as exc_info:
            generator.generate_embedding("Test text")
        
        assert "API quota exceeded" in str(exc_info.value)

    @patch('google.generativeai.embed_content')
    def test_batch_embedding_generation(self, mock_embed, generator):
        """Test batch embedding generation."""
        mock_embed.return_value = {'embedding': [0.1, 0.2]}
        
        texts = ["Text 1", "Text 2", "Text 3"]
        results = generator.generate_embeddings_batch(texts)
        
        assert len(results) == 3
        assert mock_embed.call_count == 3

    def test_embedding_dimension_consistency(self, generator):
        """Test that embeddings have consistent dimensions."""
        with patch('google.generativeai.embed_content') as mock_embed:
            # Mock different texts with same embedding dimension
            mock_embed.return_value = {'embedding': [0.1] * 384}
            
            embedding1 = generator.generate_embedding("Short text")
            embedding2 = generator.generate_embedding("Much longer text with more content")
            
            assert len(embedding1) == len(embedding2) == 384


class TestChromaVectorStore:
    """Test suite for ChromaVectorStore."""

    @pytest.fixture
    def mock_chroma_client(self):
        """Create a mock ChromaDB client."""
        client = Mock()
        collection = Mock()
        client.get_or_create_collection.return_value = collection
        return client, collection

    @pytest.fixture
    def vector_store(self, mock_chroma_client):
        """Create a vector store with mocked ChromaDB."""
        client, collection = mock_chroma_client
        with patch('chromadb.Client', return_value=client):
            store = ChromaVectorStore(
                collection_name="test_collection",
                persist_directory="/tmp/test_chroma"
            )
            store.collection = collection
            return store

    def test_add_documents(self, vector_store, mock_chroma_client):
        """Test adding documents to the vector store."""
        client, collection = mock_chroma_client
        
        documents = [
            {
                "id": "doc1",
                "content": "Error solution content",
                "embedding": [0.1, 0.2, 0.3],
                "metadata": {"source": "forum", "topic": "plugins"}
            }
        ]
        
        vector_store.add_documents(documents)
        
        collection.add.assert_called_once()
        call_args = collection.add.call_args[1]
        assert call_args["ids"] == ["doc1"]
        assert call_args["documents"] == ["Error solution content"]
        assert call_args["embeddings"] == [[0.1, 0.2, 0.3]]

    def test_search_documents(self, vector_store, mock_chroma_client):
        """Test searching documents in the vector store."""
        client, collection = mock_chroma_client
        
        # Mock search results
        collection.query.return_value = {
            "ids": [["doc1", "doc2"]],
            "documents": [["Content 1", "Content 2"]],
            "metadatas": [[{"source": "forum"}, {"source": "docs"}]],
            "distances": [[0.1, 0.2]]
        }
        
        query_embedding = [0.5, 0.6, 0.7]
        results = vector_store.search(query_embedding, top_k=2)
        
        collection.query.assert_called_once()
        assert len(results) == 2
        assert results[0]["id"] == "doc1"
        assert results[0]["content"] == "Content 1"
        assert results[0]["distance"] == 0.1

    def test_search_with_filters(self, vector_store, mock_chroma_client):
        """Test searching with metadata filters."""
        client, collection = mock_chroma_client
        collection.query.return_value = {
            "ids": [["doc1"]],
            "documents": [["Filtered content"]],
            "metadatas": [[{"source": "forum"}]],
            "distances": [[0.1]]
        }
        
        filters = {"source": "forum"}
        vector_store.search([0.1, 0.2], filters=filters)
        
        call_args = collection.query.call_args[1]
        assert call_args["where"] == filters

    def test_update_document(self, vector_store, mock_chroma_client):
        """Test updating an existing document."""
        client, collection = mock_chroma_client
        
        vector_store.update_document(
            doc_id="doc1",
            content="Updated content",
            embedding=[0.8, 0.9],
            metadata={"updated": True}
        )
        
        collection.update.assert_called_once()

    def test_delete_document(self, vector_store, mock_chroma_client):
        """Test deleting a document."""
        client, collection = mock_chroma_client
        
        vector_store.delete_document("doc1")
        
        collection.delete.assert_called_once_with(ids=["doc1"])

    def test_get_collection_stats(self, vector_store, mock_chroma_client):
        """Test getting collection statistics."""
        client, collection = mock_chroma_client
        collection.count.return_value = 1000
        
        stats = vector_store.get_collection_stats()
        
        assert stats["document_count"] == 1000
        assert "collection_name" in stats

    def test_bulk_operations(self, vector_store, mock_chroma_client):
        """Test bulk document operations."""
        client, collection = mock_chroma_client
        
        documents = [
            {"id": f"doc{i}", "content": f"Content {i}", "embedding": [i, i+1]}
            for i in range(100)
        ]
        
        vector_store.add_documents_batch(documents, batch_size=50)
        
        # Should be called twice for 100 documents with batch_size=50
        assert collection.add.call_count == 2 