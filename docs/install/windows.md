# Install IVMS on Windows

Two ways to run IVMS on Windows:

- [**Desktop app**](#desktop-app): IVMS with its own window. Everything is included; it runs while the app is open.
- [**Docker**](#docker): a background service that other computers can open in a browser.

Requirements: Windows 10 (version 1809 or later) or Windows 11, 64-bit.

## Desktop app

IVMS includes everything it needs: its own PostgreSQL database and the MediaMTX video relay. Opening IVMS starts
them; closing IVMS (or signing out, shutting down) stops them. Nothing keeps running in the background, and no
separate PostgreSQL installation is needed.

### 1. Install IVMS

1. Download `IVMS-<version>-x64-setup.exe` from the
   [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest).
2. Run it. If Windows shows *Windows protected your PC* (installers that are not code-signed yet), click
   **More info > Run anyway**.
3. Follow the steps. IVMS installs to `C:\Program Files\IVMS` for all users, or to your user folder if you choose
   *Install for me only*.

### 2. First start

IVMS creates its database (a few seconds the first time), starts the video relay and opens the sign-in page. Create the admin account.

When **Windows Defender Firewall** asks about *mediamtx*, allow **Private networks**, so IVMS can receive the camera
streams.

### Settings and logs

| What | Where |
| ---- | ----- |
| Settings | `%APPDATA%\IVMS\ivms.env` |
| Database | `%LOCALAPPDATA%\IVMS\postgres\` |
| Logs | `%LOCALAPPDATA%\IVMS\Logs\ivms.log`, `postgres.log`, `mediamtx.log` |

Paste the path into the File Explorer address bar to open it. Restart IVMS after editing the settings.

The built-in database listens on `127.0.0.1` only, port `54329` (`DB_PORT` in `ivms.env`). To keep the data on
another PostgreSQL server instead, add `DATABASE_URL=postgresql://user:password@host:5432/ivms` to `ivms.env`.

**Back up:** close IVMS, then copy `%APPDATA%\IVMS` (settings and secrets) and `%LOCALAPPDATA%\IVMS\postgres`
(database) together.

> `SECRET_KEY` in `ivms.env` encrypts the stored camera passwords: keep `ivms.env` with the database.

### Update

Download and run the new setup `.exe`. Close IVMS first; settings and data are kept.

### Uninstall

1. **Settings > Apps > Installed apps > IVMS > Uninstall**.
2. To delete the data too: delete `%APPDATA%\IVMS` (settings) and `%LOCALAPPDATA%\IVMS` (database and logs).

### Troubleshooting

| Message | Fix |
| ------- | --- |
| *Port 54329 is already in use, so the database cannot start* | Set `DB_PORT` to another free port in `ivms.env`, then **Try again**. |
| *The database did not start* | See `%LOCALAPPDATA%\IVMS\Logs\postgres.log`. Do not run IVMS with **Run as administrator**: PostgreSQL refuses to start that way. |
| *Port 8554 (or 8888, 8889, 9997) is already in use* | Another video relay is running (for example in Docker). Stop it, or set e.g. `MTX_RTSPADDRESS=:8555` in `ivms.env`. |
| *Port 8765 is already in use* | IVMS is already open, or change `API_PORT` in `ivms.env`. |
| Blank window | Install the [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (included in Windows 11). |
| Video stays black | Allow *mediamtx* in **Windows Security > Firewall & network protection > Allow an app through firewall**. |

## Docker

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) (with the WSL 2
   backend), restart if asked, and open it once.
2. Download `ivms-docker-<version>.tar.gz` from the [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest)
   and extract it (right-click > **Extract All**, or `tar -xzf ivms-docker-<version>.tar.gz` in PowerShell).
3. In PowerShell, in the extracted `ivms` folder:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\install.ps1
   ```

4. Open http://localhost:8080 and create the admin account.

Everyday use, update, back up and uninstall use the same `docker compose` commands as on Linux: see the
[Linux guide](linux.md#settings) (to update, edit `IVMS_IMAGE` in `.env` with Notepad, then run `install.ps1`
again). In Docker Desktop, turn on *Start Docker Desktop when you sign in* so IVMS runs after a restart.
