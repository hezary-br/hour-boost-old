include .env

build:
	docker build \
		--build-arg TURBO_TEAM=${TURBO_TEAM} \
		--build-arg TURBO_TOKEN=${TURBO_TOKEN} \
		-f apps/farm-service/Dockerfile . \
		-t hourboost-api:latest

start:
	docker run --rm -it \
		--env-file apps/farm-service/.env \
		--publish 4000:4000 \
		hourboost-api:latest

generate:
	cd apps/farm-service && pnpm generate

db:
	cd apps/farm-service && pnpm st