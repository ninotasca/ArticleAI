COMPOSE = docker compose

.PHONY: dev down rebuild logs

## Start frontend (hot-reload)
dev:
	$(COMPOSE) up

## Start in background
dev-bg:
	$(COMPOSE) up -d

## Stop
down:
	$(COMPOSE) down

## Full rebuild + start
rebuild:
	$(COMPOSE) up --build

## Tail logs
logs:
	$(COMPOSE) logs -f
