.PHONY: help install seed test run-backend run-frontend docker-up docker-down

help:
	@echo "RailOpt-AI Management Commands:"
	@echo "  make install       Install python & frontend dependencies"
	@echo "  make seed          Seed database with synthetic demo data"
	@echo "  make test          Run pytest suite"
	@echo "  make run-backend   Start FastAPI backend server on :8100"
	@echo "  make run-frontend  Start Vite development server on :5180"
	@echo "  make docker-up     Start all containers via Docker Compose"
	@echo "  make docker-down   Stop all Docker Compose containers"

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

seed:
	python scripts/generate_demo_data.py --days 7

test:
	python -m pytest tests/ -v

run-backend:
	cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8100

run-frontend:
	cd frontend && npm run dev

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down
