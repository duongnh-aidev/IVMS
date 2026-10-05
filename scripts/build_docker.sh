#!/usr/bin/env bash
# Builds the IVMS app image for linux/amd64 + linux/arm64 and the install bundle (deploy/docker).
#
#   scripts/build_docker.sh                 build both archs into the local image store (to test)
#   scripts/build_docker.sh --push          build and push to the registry (docker login first)
#   scripts/build_docker.sh --save          also write offline archives, one per arch (app + postgres + mediamtx)
#
# Registry (IVMS_IMAGE or --image, without tag):
#   default: ghcr.io/duongnh-aidev/ivms   (docker login ghcr.io -u <user> with a PAT: write:packages)
#
# Output in dist/docker/: ivms-docker-<version>.tar.gz (compose bundle) and, with --save, ivms-<version>-<arch>.tar
set -euo pipefail
cd "$(dirname "$0")/.."

image="${IVMS_IMAGE:-ghcr.io/duongnh-aidev/ivms}"
platforms="linux/amd64,linux/arm64"
push=false save=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) push=true; shift ;;
    --save) save=true; shift ;;
    --image) image="$2"; shift 2 ;;
    --platforms) platforms="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1 (see --help)" >&2; exit 2 ;;
  esac
done

version="$(sed -n 's/^version = "\(.*\)"/\1/p' pyproject.toml | head -1)"
revision="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
[[ -z "$(git status --porcelain 2>/dev/null)" ]] || revision="$revision-dirty"
mediamtx_version="$(sed -n 's/^MEDIAMTX_VERSION=//p' deploy/docker/.env.example)"
out=dist/docker
mkdir -p "$out"

docker buildx version >/dev/null || { echo "docker buildx is required" >&2; exit 1; }
if ! $push && [[ "$platforms" == *,* ]] && [[ "$(docker info --format '{{json .DriverStatus}}')" != *containerd* ]]; then
  echo "Loading a multi-arch image needs Docker's containerd image store (Docker Desktop: Settings > General)." >&2
  echo "Use --push, or --platforms linux/$(docker info --format '{{.Architecture}}' | sed 's/x86_64/amd64/;s/aarch64/arm64/')." >&2
  exit 1
fi

echo "==> Building $image:$version ($revision) for $platforms"
docker buildx build \
  --platform "$platforms" \
  --tag "$image:$version" \
  --tag "$image:latest" \
  --label "org.opencontainers.image.source=https://github.com/duongnh-aidev/IVMS" \
  --label "org.opencontainers.image.version=$version" \
  --label "org.opencontainers.image.revision=$revision" \
  --label "org.opencontainers.image.title=IVMS" \
  $($push && echo --push || echo --load) \
  .

if $save; then
  for platform in ${platforms//,/ }; do
    arch="${platform#linux/}"
    file="$out/ivms-$version-$arch.tar"
    echo "==> Offline archive $file"
    docker pull --quiet --platform "$platform" postgres:17 >/dev/null
    docker pull --quiet --platform "$platform" "bluenviron/mediamtx:$mediamtx_version" >/dev/null
    $push && docker pull --quiet --platform "$platform" "$image:$version" >/dev/null
    docker save --platform "$platform" --output "$file" \
      "$image:$version" postgres:17 "bluenviron/mediamtx:$mediamtx_version"
  done
fi

echo "==> Install bundle"
bundle="$(mktemp -d)/ivms"
mkdir -p "$bundle"
cp deploy/docker/compose.yml deploy/docker/mediamtx.yml deploy/docker/install.sh deploy/docker/install.ps1 \
  deploy/docker/README.md "$bundle/"
# Pin the bundle to the image it was built with
sed "s|^IVMS_IMAGE=.*|IVMS_IMAGE=$image:$version|" deploy/docker/.env.example >"$bundle/.env.example"
tar -czf "$out/ivms-docker-$version.tar.gz" -C "$(dirname "$bundle")" ivms
rm -rf "$(dirname "$bundle")"

echo
echo "Done: $image:$version ($($push && echo pushed || echo "local image store"))"
ls -lh "$out"
