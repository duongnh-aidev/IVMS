#!/usr/bin/env bash
# Builds IVMS.app and IVMS-<version>-<arch>.dmg for macOS (the arch of this Mac: arm64 or x86_64).
# Bundles PostgreSQL, MediaMTX and the web UI: the app starts and stops them itself.
#
#   scripts/build_macos.sh                                   unsigned (ad-hoc) build, for testing
#   scripts/build_macos.sh --sign "Developer ID Application: Name (TEAMID)"
#   scripts/build_macos.sh --sign "..." --notarize <keychain-profile>
#       profile created once with: xcrun notarytool store-credentials <profile> --apple-id ... --team-id ...
#
# Needs: Xcode command line tools, Node.js (frontend build), uv. Output: dist/macos/
set -euo pipefail
cd "$(dirname "$0")/.."

MEDIAMTX_VERSION=1.21.1
# From https://github.com/bluenviron/mediamtx/releases/tag/v1.21.1 (checksums.sha256)
MEDIAMTX_SHA256_arm64=25e20ed41611f1f3103b8359585210b29b11b69fa0d9e11bd11b92f7bbcb42ef
MEDIAMTX_SHA256_amd64=be403a36d2225668ea695cbd2c784109bc23ef9a32f886837e43c920b6818813

identity="" notary_profile=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --sign) identity="$2"; shift 2 ;;
    --notarize) notary_profile="$2"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1 (see --help)" >&2; exit 2 ;;
  esac
done
[[ "$(uname)" == Darwin ]] || { echo "Run this on macOS" >&2; exit 1; }
[[ -z "$notary_profile" || -n "$identity" ]] || { echo "--notarize needs --sign" >&2; exit 2; }

arch="$(uname -m)"                      # arm64 | x86_64
mtx_arch="${arch/x86_64/amd64}"         # MediaMTX names x86_64 "amd64"
version="$(sed -n 's/^version = "\(.*\)"/\1/p' pyproject.toml | head -1)"
build=build/macos out=dist/macos
mkdir -p "$build" "$out"

echo "==> Web UI"
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build

echo "==> MediaMTX $MEDIAMTX_VERSION ($mtx_arch)"
sha_var="MEDIAMTX_SHA256_$mtx_arch"
tarball="$build/mediamtx_v${MEDIAMTX_VERSION}_darwin_$mtx_arch.tar.gz"
if [[ ! -f "$tarball" ]]; then
  curl -fsSL -o "$tarball" \
    "https://github.com/bluenviron/mediamtx/releases/download/v$MEDIAMTX_VERSION/mediamtx_v${MEDIAMTX_VERSION}_darwin_$mtx_arch.tar.gz"
fi
echo "${!sha_var}  $tarball" | shasum -a 256 -c - >/dev/null || { echo "MediaMTX checksum mismatch" >&2; rm -f "$tarball"; exit 1; }
tar -xzf "$tarball" -C "$build" mediamtx

echo "==> PostgreSQL"
uv run --no-project python packaging/desktop/prepare_postgres.py \
  "$([[ "$arch" == arm64 ]] && echo darwin-arm64v8 || echo darwin-amd64)" "$build/postgres"

echo "==> Icon"
iconset="$build/IVMS.iconset"
rm -rf "$iconset" && mkdir -p "$iconset"
for size in 16 32 128 256 512; do
  sips -z $size $size packaging/macos/icon.png --out "$iconset/icon_${size}x${size}.png" >/dev/null
  sips -z $((size * 2)) $((size * 2)) packaging/macos/icon.png --out "$iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$iconset" -o "$build/IVMS.icns"

echo "==> App bundle"
uv sync --group desktop
uv run --group desktop pyinstaller packaging/macos/IVMS.spec \
  --noconfirm --clean --distpath "$out" --workpath "$build/pyinstaller"
app="$out/IVMS.app"

if [[ -n "$identity" ]]; then
  echo "==> Signing with $identity"
  # Inside-out: nested binaries first, then the bundle, all with the hardened runtime (needed to notarize)
  find "$app/Contents" -type f \( -perm -u+x -o -name '*.so' -o -name '*.dylib' \) -print0 |
    xargs -0 codesign --force --timestamp --options runtime \
      --entitlements packaging/macos/entitlements.plist --sign "$identity"
  codesign --force --timestamp --options runtime \
    --entitlements packaging/macos/entitlements.plist --sign "$identity" "$app"
  codesign --verify --deep --strict "$app"
fi

echo "==> Disk image"
dmg="$out/IVMS-$version-$arch.dmg"
staging="$build/dmg"
rm -rf "$staging" "$dmg" && mkdir -p "$staging"
cp -R "$app" "$staging/"
ln -s /Applications "$staging/Applications"
cat >"$staging/Read me first.txt" <<TXT
IVMS $version for macOS ($arch)

1. Drag IVMS to Applications and open it. Everything IVMS needs (database, video relay) is included
   and starts with the app; quitting IVMS stops it.
2. The first time, create the admin account.

Settings and data: ~/Library/Application Support/IVMS/   Logs: ~/Library/Logs/IVMS/
TXT
hdiutil create -volname "IVMS $version" -srcfolder "$staging" -fs HFS+ -format UDZO -ov "$dmg" >/dev/null
[[ -z "$identity" ]] || codesign --force --timestamp --sign "$identity" "$dmg"

if [[ -n "$notary_profile" ]]; then
  echo "==> Notarizing"
  xcrun notarytool submit "$dmg" --keychain-profile "$notary_profile" --wait
  xcrun stapler staple "$dmg"
fi

echo
echo "Done: $dmg"
[[ -n "$identity" ]] || echo "Unsigned build: on other Macs, right-click IVMS > Open the first time (Gatekeeper)."
ls -lh "$out"
