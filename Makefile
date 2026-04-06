COMPOSE = docker compose

.PHONY: dev down rebuild logs

## Start all services (hot-reload enabled)
dev:
	$(COMPOSE) up

## Start in background
dev-bg:
	$(COMPOSE) up -d

## Stop all services
down:
	$(COMPOSE) down

## Full rebuild + start (use after dependency changes)
rebuild:
	$(COMPOSE) up --build

## Tail logs for all services
logs:
	$(COMPOSE) logs -f

## Tail frontend logs only
logs-frontend:
	$(COMPOSE) logs -f frontend

## Tail backend logs only
logs-backend:
	$(COMPOSE) logs -f backend
