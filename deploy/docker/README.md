# Install IVMS with Docker

Runs on macOS, Windows and Linux, on Intel/AMD (amd64) and Apple Silicon/ARM (arm64) machines.
Three containers: the IVMS app (web UI + API), PostgreSQL and the MediaMTX stream relay.

## Requirements

- Docker Desktop (macOS, Windows) or Docker Engine with Compose v2 (Linux)
- Free ports: 8080 (web UI), 8554, 8888, 8889 and 8189/udp (video streams). Change them in `.env`.

## Install

macOS / Linux:

```bash
./install.sh
```

Windows (PowerShell):

```powershell
.\install.ps1
```

The script creates `.env` with random secrets, downloads the images and starts IVMS.
Open http://localhost:8080. On the first visit, create the admin account.

### Without internet

Copy the archive that matches the machine (`ivms-<version>-amd64.tar` or `ivms-<version>-arm64.tar`)
next to this folder, then:

```bash
./install.sh --load ../ivms-<version>-arm64.tar
```

## Everyday use

```bash
docker compose ps              # status
docker compose logs -f app     # app logs
docker compose stop            # stop IVMS
docker compose start           # start it again
```

## Update

Set the new version in `IVMS_IMAGE` in `.env` (or pass `--image`), then run `./install.sh` again.
Database migrations run automatically when the app starts. Keep `.env`: it holds the secrets your data
depends on.

## Back up

Back up `.env` and the database:

```bash
docker compose exec postgres pg_dump -U ivms ivms > ivms-backup.sql
```

## Uninstall

```bash
docker compose down        # keeps the data
docker compose down -v     # also deletes all data
```
