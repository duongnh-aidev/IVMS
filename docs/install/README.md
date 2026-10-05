# Install IVMS

IVMS runs on Linux, macOS and Windows. Pick the guide for your machine:

| System | Recommended | Also possible |
| ------ | ----------- | ------------- |
| **Linux** (server, mini PC, Jetson) | [Docker](linux.md) | — |
| **macOS** 12+ (Apple silicon or Intel) | [Desktop app](macos.md#desktop-app) | [Docker](macos.md#docker) |
| **Windows** 10/11 (64-bit) | [Desktop app](windows.md#desktop-app) | [Docker](windows.md#docker) |

**Desktop app** or **Docker**?

- **Desktop app**: a normal app with its own window. Good for one PC that watches the cameras. You install PostgreSQL
  yourself (one installer), and IVMS runs while the app is open.
- **Docker**: runs as a background service that starts with the machine, and other computers on the network
  open it in a browser. Good for a server or a recorder box that is always on. PostgreSQL is included.

Downloads are on the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest):

| File | For |
| ---- | --- |
| `IVMS-<version>-arm64.dmg` | macOS, Apple silicon (M1 and later) |
| `IVMS-<version>-x86_64.dmg` | macOS, Intel |
| `IVMS-<version>-x64-setup.exe` | Windows 10/11, 64-bit |
| `ivms-docker-<version>.tar.gz` | Docker install bundle (Linux, macOS, Windows) |
| `SHA256SUMS` | Checksums to verify the downloads |

The Docker image itself is `ghcr.io/duongnh-aidev/ivms:<version>`.

## After installing

1. Open IVMS (desktop app) or http://localhost:8080 (Docker; from another computer, `http://<server-ip>:8080`).
2. On the first visit, create the **admin account**.
3. Add your cameras in **Devices**: the IP address, RTSP port (usually 554) and the camera's user and password.

## Network ports

The cameras must be reachable from the machine running IVMS, and viewers must reach these ports on it:

| Port | Used for | Desktop app | Docker |
| ---- | -------- | ----------- | ------ |
| 8080/tcp | Web UI and API | — (local only, 8765) | ✓ |
| 8554/tcp | RTSP (video out to players such as VLC or analytics) | ✓ | ✓ |
| 8888/tcp | HLS video in the browser | ✓ | ✓ |
| 8889/tcp, 8189/udp | WebRTC video in the browser | ✓ | ✓ |

If a port is already taken, change it in the settings file (see each guide).

## Verify a download (optional)

```bash
sha256sum -c SHA256SUMS --ignore-missing         # Linux
shasum -a 256 -c SHA256SUMS --ignore-missing     # macOS
```

```powershell
Get-FileHash .\IVMS-<version>-x64-setup.exe      # Windows: compare with the line in SHA256SUMS
```

## Need help?

Check the troubleshooting section of your guide, then open an
[issue](https://github.com/duongnh-aidev/IVMS/issues) with your system, IVMS version and the log file.
