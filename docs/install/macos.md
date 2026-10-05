# Install IVMS on macOS

Two ways to run IVMS on a Mac:

- [**Desktop app**](#desktop-app): IVMS.app with its own window. Runs while the app is open.
- [**Docker**](#docker): a background service that other computers can open in a browser.

Requirements: macOS 12 Monterey or later, Apple silicon (M1 and later) or Intel.

## Desktop app

### 1. Install PostgreSQL (Postgres.app)

IVMS keeps its data in PostgreSQL, which is installed separately:

1. Download **Postgres.app** from [postgresapp.com](https://postgresapp.com/downloads.html).
2. Move it to **Applications** and open it.
3. Click **Initialize** (first time) or **Start**.

Leave Postgres.app running, or turn on *Automatically start server* in its settings.

### 2. Install IVMS

1. Download the disk image from the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest):
   - Apple silicon: `IVMS-<version>-arm64.dmg`
   - Intel: `IVMS-<version>-x86_64.dmg`

   Not sure? Apple menu  > **About This Mac**: *Chip: Apple M…* means Apple silicon.
2. Open the `.dmg` and drag **IVMS** onto **Applications**.
3. Open IVMS from Applications.

If macOS says IVMS *cannot be opened* or *cannot be verified* (builds that are not signed by Apple):
open **System Settings > Privacy & Security**, scroll down to the message about IVMS, click **Open Anyway** and
confirm. This is needed only once.

### 3. First start

IVMS creates its database, starts the video relay and opens the sign-in page. Create the admin account.
macOS asks once whether IVMS may find devices on your **local network**: click **Allow**, otherwise IVMS cannot
reach the cameras.

### Settings and logs

| What | Where |
| ---- | ----- |
| Settings | `~/Library/Application Support/IVMS/ivms.env` |
| Logs | `~/Library/Logs/IVMS/ivms.log`, `mediamtx.log` |

In Finder, press **⇧⌘G** and paste the path. Restart IVMS after editing the settings.

`DATABASE_URL` points to Postgres.app by default (your macOS user, no password). To use another PostgreSQL
server, change it, for example `postgresql://user:password@192.168.1.20:5432/ivms`.

> Keep `ivms.env` backed up. `SECRET_KEY` encrypts the stored camera passwords.

### Update

Download the new `.dmg` and drag IVMS onto Applications again (choose **Replace**). Your settings and data are kept.

### Uninstall

1. Quit IVMS and move it from Applications to the Trash.
2. To delete the data too: delete `~/Library/Application Support/IVMS` and `~/Library/Logs/IVMS`, then in
   Postgres.app open `psql` and run `DROP DATABASE ivms;`.

### Troubleshooting

| Message | Fix |
| ------- | --- |
| *PostgreSQL is not running* | Open Postgres.app and click **Start**, then **Try again** in IVMS. |
| *Port 8554 (or 8888, 8889, 9997) is already in use* | Another video relay is running, often a MediaMTX container from Docker. Stop it, or set e.g. `MTX_RTSPADDRESS=:8555` in `ivms.env`. |
| *Port 8765 is already in use* | IVMS is already open (check the Dock), or change `API_PORT` in `ivms.env`. |
| Cameras do not connect | **System Settings > Privacy & Security > Local Network**: turn on IVMS. |

## Docker

1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon or
   Intel) and open it once.
2. Download `ivms-docker-<version>.tar.gz` from the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest)
   and double-click it to extract the `ivms` folder.
3. In Terminal:

   ```bash
   cd ~/Downloads/ivms
   ./install.sh
   ```

4. Open http://localhost:8080 and create the admin account.

Everyday use, update, back up and uninstall work the same as on Linux: see the
[Linux guide](linux.md#settings). In Docker Desktop, turn on *Start Docker Desktop when you sign in* so IVMS runs
after a restart.
