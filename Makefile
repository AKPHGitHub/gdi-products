.PHONY: up down restart logs ps build test dev clean wait load-test benchmark

# Default: bring up dev — builds on host first so dist is present for volume mount
up:
	@npm run build --loglevel=error
	@docker compose build --quiet
	@docker compose up -d
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

wait:
	@echo "→ waiting for http://localhost:3000 (60s)..."
	@timeout=60; until curl -fsS http://localhost:3000 >/dev/null 2>&1; do sleep 2; timeout=$$((timeout-2)); \
	  if [ $$timeout -le 0 ]; then echo "✗ timeout"; docker compose ps; docker compose logs --tail=100 app; exit 1; fi; \
	  echo "  ...retry ($$timeout s left)"; done; echo "✓ app ready"; docker compose ps

load-test: up wait
	@echo "→ running 4-shopper puppeteer (BASE_URL=http://localhost:3000)"
	BASE_URL=http://localhost:3000 node load-test/puppeteer-demo.js

benchmark:
	@node --version
	@echo "→ hook benchmark via src/hooks/useProgressiveProducts.ts (sequential, stubbed 150ms, no rate-limit) ..."
	@NODE_NO_WARNINGS=1 STUB=1 npx tsx benchmark.js 2>&1 | grep -v -e DeprecationWarning -e "module.register"