#!/bin/sh
set -eu

corepack pnpm --filter @erptry/api db:migrate
corepack pnpm --filter @erptry/api db:seed

exec corepack pnpm --filter @erptry/api start
