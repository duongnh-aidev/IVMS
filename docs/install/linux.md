# Install IVMS on Linux

IVMS runs on Linux with Docker: three containers (the IVMS app, PostgreSQL and the MediaMTX video relay) that start
automatically with the machine. Works on x86-64 (amd64) and ARM64 (Raspberry Pi 4/5 with a 64-bit OS, Jetson, ARM
servers).

## Requirements

- A 64-bit Linux distribution (Ubuntu 22.04+, Debian 12+, Fedora, RHEL 9 and similar)
- 2 CPU cores, 2 GB RAM, plus disk space for recordings
- Docker Engine with the Compose v2 plugin

## 1. Install Docker

If `docker compose version` already works, skip this step.

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"     # use docker without sudo
newgrp docker                       # or log out and back in
docker compose version              # check
```

Other ways to install: [docs.docker.com/engine/install](https://docs.docker.com/engine/install/).

## 2. Download and install IVMS

Replace `<version>` with the latest version from the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest)
(for example `1.0.0`):

```bash
VERSION=<version>
curl -fLO "https://github.com/duongnh-aidev/IVMS/releases/download/v$VERSION/ivms-docker-$VERSION.tar.gz"
tar -xzf "ivms-docker-$VERSION.tar.gz"
cd ivms
./install.sh
```

`install.sh` creates `.env` with random secrets, downloads the images and starts IVMS.

Open `http://<server-ip>:8080` in a browser and create the admin account.

## 3. Open the firewall (if enabled)

```bash
# Ubuntu / Debian (ufw)
sudo ufw allow 8080/tcp && sudo ufw allow 8554/tcp && sudo ufw allow 8888:8889/tcp && sudo ufw allow 8189/udp

# Fedora / RHEL (firewalld)
sudo firewall-cmd --permanent --add-port={8080,8554,8888,8889}/tcp --add-port=8189/udp && sudo firewall-cmd --reload
```

## Settings

All settings are in `ivms/.env`, for example `IVMS_PORT` (web UI port) and the `MEDIAMTX_*_PORT` video ports.
After editing, apply them with `docker compose up -d`.

> Keep `.env` safe and backed up. `SECRET_KEY` encrypts the stored camera passwords: if it is lost or changed,
> the cameras have to be added again.

## Everyday use

Run these in the `ivms` folder:

```bash
docker compose ps              # status
docker compose logs -f app     # app logs
docker compose stop            # stop IVMS
docker compose start           # start it again
```

IVMS starts again by itself after a reboot.

## Update

```bash
cd ivms
sed -i "s|^IVMS_IMAGE=.*|IVMS_IMAGE=ghcr.io/duongnh-aidev/ivms:<new-version>|" .env
./install.sh
```

Database upgrades run automatically when the app starts. Read the release notes before a major update.

## Back up and restore

```bash
docker compose exec -T postgres pg_dump -U ivms ivms > ivms-backup.sql    # back up (also keep .env)
docker compose exec -T postgres psql -U ivms ivms < ivms-backup.sql       # restore into an empty install
```

## Uninstall

```bash
docker compose down        # stop and remove the containers, keep the data
docker compose down -v     # also delete all data (the database and video relay state)
```

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `port is already allocated` | Another program uses the port. Change `IVMS_PORT` or the `MEDIAMTX_*_PORT` value in `.env`, then `./install.sh`. |
| `permission denied ... docker.sock` | Your user is not in the `docker` group: `sudo usermod -aG docker "$USER"`, then log in again. |
| Web UI opens but video stays black | Open ports 8888–8889/tcp and 8189/udp in the firewall; check that the camera's RTSP address works in VLC. |
| App keeps restarting | `docker compose logs app` shows the reason (often the database password in `.env` was changed after the first install). |
