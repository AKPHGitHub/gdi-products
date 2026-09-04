.PHONY: up down restart logs ps build test dev clean

# Default: bring up dev (plain React + TS, no Vite)
up:
	docker compose up --build -d
	@echo "→ http://localhost:3000"

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

ps:
	docker compose ps

build:
	npm run build

test:
	npm test

dev:
	npx serve dist -l 3000

clean:
	docker compose down -v --remove-orphans
	rm -rf dist
