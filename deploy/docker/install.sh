#!/usr/bin/env bash
# Installs or updates IVMS with Docker (macOS / Linux). Run from this folder: ./install.sh
# Options: --image <ref>   use this image (default: IVMS_IMAGE from .env)
#          --load <file>   load an offline image archive (docker save) first
set -euo pipefail
cd "$(dirname "$0")"

image="" archive=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) image="$2"; shift 2 ;;
    --load) archive="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

command -v docker >/dev/null || { echo "Docker is required: https://docs.docker.com/get-docker/" >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose v2 is required" >&2; exit 1; }

secret() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"; }
set_var() { # set_var KEY VALUE: replace the line KEY=... in .env
  local tmp; tmp="$(mktemp)"
  awk -v k="$1" -v v="$2" 'BEGIN{FS=OFS="="} $1==k{$0=k"="v} {print}' .env >"$tmp" && mv "$tmp" .env
}
get_var() { grep -E "^$1=" .env | cut -d= -f2- || true; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env"
fi
# Fill only empty secrets: an existing install keeps its own
for key in POSTGRES_PASSWORD SECRET_KEY JWT_SECRET; do
  [[ -n "$(get_var "$key")" ]] || set_var "$key" "$(secret 48)"
done
[[ -z "$image" ]] || set_var IVMS_IMAGE "$image"

if [[ -n "$archive" ]]; then
  docker load --input "$archive"
else
  docker compose pull
fi
docker compose up --detach --wait

echo
echo "IVMS is running: http://localhost:$(get_var IVMS_PORT)"
echo "First visit: create the admin account. Logs: docker compose logs -f app"
