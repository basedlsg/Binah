# Quest Dev Copilot - Development Makefile
# Provides common development tasks and shortcuts

.PHONY: help install dev-install clean test test-unit test-integration test-all
.PHONY: lint format type-check security-check docs serve-docs
.PHONY: docker-build docker-up docker-down docker-logs docker-clean
.PHONY: setup-db init-knowledge-base backup-db restore-db
.PHONY: deploy-staging deploy-production release pre-commit

# Default target
.DEFAULT_GOAL := help

# Variables
PYTHON := python3
PIP := $(PYTHON) -m pip
PYTEST := $(PYTHON) -m pytest
BLACK := $(PYTHON) -m black
FLAKE8 := $(PYTHON) -m flake8
MYPY := $(PYTHON) -m mypy
BANDIT := $(PYTHON) -m bandit
DOCKER_COMPOSE := docker-compose
PROJECT_NAME := quest-dev-copilot

# Help target
help: ## Show this help message
	@echo "Quest Dev Copilot - Development Commands"
	@echo "========================================"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation targets
install: ## Install production dependencies
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

dev-install: ## Install development dependencies
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	$(PIP) install -e ".[dev,test,docs]"
	pre-commit install

# Cleaning targets
clean: ## Clean up build artifacts and cache
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf coverage.xml
	rm -rf bandit-report.json

# Testing targets
test: test-unit ## Run unit tests (default)

test-unit: ## Run unit tests only
	$(PYTEST) tests/unit/ -v

test-integration: ## Run integration tests only
	$(PYTEST) tests/integration/ -v

test-all: ## Run all tests including slow ones
	$(PYTEST) tests/ -v --runall

test-coverage: ## Run tests with coverage report
	$(PYTEST) tests/ --cov=backend --cov=rag --cov=llama --cov=crawler \
		--cov-report=html --cov-report=term-missing --cov-fail-under=80

test-watch: ## Run tests in watch mode
	$(PYTEST) tests/ -f

# Code quality targets
lint: ## Run linting checks
	$(FLAKE8) backend/ rag/ llama/ crawler/ tests/

format: ## Format code with black and isort
	$(BLACK) backend/ rag/ llama/ crawler/ tests/ scripts/
	$(PYTHON) -m isort backend/ rag/ llama/ crawler/ tests/ scripts/

format-check: ## Check if code formatting is correct
	$(BLACK) --check backend/ rag/ llama/ crawler/ tests/ scripts/
	$(PYTHON) -m isort --check-only backend/ rag/ llama/ crawler/ tests/ scripts/

type-check: ## Run type checking with mypy
	$(MYPY) backend/ rag/ llama/

security-check: ## Run security checks with bandit
	$(BANDIT) -r backend/ rag/ llama/ crawler/ -f json -o bandit-report.json
	$(PYTHON) -m safety check

pre-commit: ## Run all pre-commit hooks
	pre-commit run --all-files

# Quality check combo
quality-check: lint format-check type-check security-check ## Run all quality checks

# Documentation targets
docs: ## Build documentation
	cd docs && $(PYTHON) -m sphinx . _build/html

docs-clean: ## Clean documentation build
	rm -rf docs/_build/

docs-serve: docs ## Build and serve documentation locally
	cd docs/_build/html && $(PYTHON) -m http.server 8080

docs-watch: ## Build documentation in watch mode
	cd docs && sphinx-autobuild . _build/html --host 0.0.0.0 --port 8080

# Docker targets
docker-build: ## Build all Docker images
	$(DOCKER_COMPOSE) build

docker-build-backend: ## Build backend Docker image only
	$(DOCKER_COMPOSE) build backend

docker-up: ## Start all services with Docker Compose
	$(DOCKER_COMPOSE) up -d

docker-up-dev: ## Start development services
	$(DOCKER_COMPOSE) up -d backend redis postgres

docker-up-full: ## Start all services including monitoring
	$(DOCKER_COMPOSE) --profile monitoring up -d

docker-down: ## Stop all Docker services
	$(DOCKER_COMPOSE) down

docker-logs: ## Show Docker service logs
	$(DOCKER_COMPOSE) logs -f

docker-logs-backend: ## Show backend service logs only
	$(DOCKER_COMPOSE) logs -f backend

docker-shell: ## Open shell in backend container
	$(DOCKER_COMPOSE) exec backend /bin/bash

docker-shell-dev: ## Open shell in dev-tools container
	$(DOCKER_COMPOSE) run --rm dev-tools /bin/bash

docker-clean: ## Clean up Docker images and volumes
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Database targets
setup-db: ## Set up development database
	$(DOCKER_COMPOSE) up -d postgres redis
	sleep 5
	$(PYTHON) scripts/setup_database.py

init-knowledge-base: ## Initialize the knowledge base with sample data
	$(PYTHON) scripts/init_knowledge_base.py

backup-db: ## Backup development database
	$(DOCKER_COMPOSE) exec postgres pg_dump -U quest_dev quest_copilot > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database from backup (set BACKUP_FILE=filename)
	$(DOCKER_COMPOSE) exec -T postgres psql -U quest_dev -d quest_copilot < $(BACKUP_FILE)

# Development targets
dev: docker-up-dev ## Start development environment
	@echo "🚀 Development environment started!"
	@echo "📊 Backend: http://localhost:5000"
	@echo "🔍 ChromaDB: http://localhost:8000"
	@echo "📋 Redis: localhost:6379"
	@echo "🗄️  PostgreSQL: localhost:5432"

dev-stop: docker-down ## Stop development environment

dev-logs: docker-logs ## Show development logs

dev-shell: docker-shell-dev ## Open development shell

# API testing targets
test-api: ## Test API endpoints manually
	$(PYTHON) scripts/test_api.py

test-cli: ## Test CLI tool with sample data
	$(PYTHON) cli/quest_fix.py sample_logs/plugin_conflict.log --verbose

benchmark: ## Run performance benchmarks
	$(PYTHON) scripts/benchmark.py

# Deployment targets
build-release: clean quality-check test-all ## Build release package
	$(PYTHON) -m build

deploy-staging: ## Deploy to staging environment
	@echo "🚀 Deploying to staging..."
	# Add staging deployment commands here
	@echo "✅ Deployed to staging"

deploy-production: ## Deploy to production environment
	@echo "🚀 Deploying to production..."
	# Add production deployment commands here
	@echo "✅ Deployed to production"

# Release targets
version-patch: ## Bump patch version
	$(PYTHON) scripts/bump_version.py patch

version-minor: ## Bump minor version
	$(PYTHON) scripts/bump_version.py minor

version-major: ## Bump major version
	$(PYTHON) scripts/bump_version.py major

release: ## Create a new release
	@echo "🎯 Creating release..."
	@echo "1. Running quality checks..."
	@$(MAKE) quality-check
	@echo "2. Running full test suite..."
	@$(MAKE) test-all
	@echo "3. Building documentation..."
	@$(MAKE) docs
	@echo "4. Building release package..."
	@$(MAKE) build-release
	@echo "✅ Release ready!"
	@echo "📦 Run 'git tag v$(shell python -c "import toml; print(toml.load('pyproject.toml')['project']['version'])")' to tag the release"

# Utility targets
setup: ## Initial project setup
	@echo "🔧 Setting up Quest Dev Copilot development environment..."
	@$(MAKE) dev-install
	@$(MAKE) setup-db
	@$(MAKE) init-knowledge-base
	@echo "✅ Setup complete!"
	@echo "🚀 Run 'make dev' to start development environment"

status: ## Show project status
	@echo "Quest Dev Copilot Status"
	@echo "======================="
	@echo "Python version: $(shell $(PYTHON) --version)"
	@echo "Pip version: $(shell $(PIP) --version)"
	@echo "Git branch: $(shell git branch --show-current 2>/dev/null || echo 'Not a git repository')"
	@echo "Docker status: $(shell docker --version 2>/dev/null || echo 'Docker not available')"
	@echo "Services status:"
	@$(DOCKER_COMPOSE) ps 2>/dev/null || echo "No services running"

update-deps: ## Update all dependencies
	$(PIP) install --upgrade pip
	$(PIP) install --upgrade -r requirements.txt
	$(PIP) install --upgrade -e ".[dev,test,docs]"

freeze-deps: ## Freeze current dependencies
	$(PIP) freeze > requirements-frozen.txt

# Environment-specific targets
env-check: ## Check environment configuration
	@echo "🔍 Checking environment..."
	@$(PYTHON) scripts/check_environment.py

env-example: ## Copy .env.example to .env
	cp .env.example .env
	@echo "📝 Created .env file from template"
	@echo "⚠️  Please edit .env and add your API keys"

# Quick development workflow
quick-start: env-example dev ## Quick start for new developers
	@echo "🎉 Quick start complete!"
	@echo "📝 Next steps:"
	@echo "  1. Edit .env file with your API keys"
	@echo "  2. Run 'make test' to verify everything works"
	@echo "  3. Open http://localhost:5000/health to check backend"

# Advanced targets
profile: ## Profile the application
	$(PYTHON) -m cProfile -o profile.stats scripts/profile_app.py
	$(PYTHON) -c "import pstats; pstats.Stats('profile.stats').sort_stats('cumulative').print_stats(20)"

monitor: ## Start monitoring stack
	$(DOCKER_COMPOSE) --profile monitoring up -d
	@echo "📊 Monitoring available at:"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3000 (admin/admin)"

debug: ## Start backend with debugger
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.debug.yml up backend

# Cleanup targets
clean-all: clean docker-clean ## Clean everything including Docker
	rm -rf .env
	rm -rf data/
	rm -rf logs/