# Install IVMS on Windows

Two ways to run IVMS on Windows:

- [**Desktop app**](#desktop-app): IVMS with its own window. Runs while the app is open.
- [**Docker**](#docker): a background service that other computers can open in a browser.

Requirements: Windows 10 (version 1809 or later) or Windows 11, 64-bit.

## Desktop app

### 1. Install PostgreSQL

IVMS keeps its data in PostgreSQL, which is installed separately:

1. Download the PostgreSQL installer for Windows (version 15 or later) from
   [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Run it and keep the defaults (port **5432**). Stack Builder at the end is not needed.
3. Choose a password for the `postgres` user and **write it down**: IVMS needs it.

PostgreSQL then runs as a Windows service and starts with the computer.

### 2. Install IVMS

1. Download `IVMS-<version>-x64-setup.exe` from the
   [Releases page](https://github.com/duongnh-aidev/IVMS/releases/latest).
2. Run it. If Windows shows *Windows protected your PC* (installers that are not code-signed yet), click
   **More info > Run anyway**.
3. Follow the steps. IVMS installs to `C:\Program Files\IVMS` for all users, or to your user folder if you choose
   *Install for me only*.

### 3. First start: connect to PostgreSQL

The first time, IVMS shows *PostgreSQL rejected the login*, because it does not know the password yet:

1. Click **Open settings**. `ivms.env` opens in Notepad.
2. Put the `postgres` password in the `DATABASE_URL` line:

   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ivms
   ```

   If the password contains `@`, `:`, `/` or `#`, write them as `%40`, `%3A`, `%2F` and `%23`.
3. Save, go back to IVMS and click **Try again**.

IVMS creates its database, starts the video relay and opens the sign-in page. Create the admin account.

When **Windows Defender Firewall** asks about *mediamtx*, allow **Private networks**, so IVMS can receive the camera
streams.

### Settings and logs

| What | Where |
| ---- | ----- |
| Settings | `%APPDATA%\IVMS\ivms.env` |
| Logs | `%LOCALAPPDATA%\IVMS\Logs\ivms.log`, `mediamtx.log` |

Paste the path into the File Explorer address bar to open it. Restart IVMS after editing the settings.

> Keep `ivms.env` backed up. `SECRET_KEY` encrypts the stored camera passwords.

### Update

Download and run the new setup `.exe`. Close IVMS first; settings and data are kept.

### Uninstall

1. **Settings > Apps > Installed apps > IVMS > Uninstall**.
2. To delete the data too: delete `%APPDATA%\IVMS` and `%LOCALAPPDATA%\IVMS`, then delete the `ivms` database with
   pgAdmin (installed with PostgreSQL) or `psql -U postgres -c "DROP DATABASE ivms;"`.

### Troubleshooting

| Message | Fix |
| ------- | --- |
| *PostgreSQL rejected the login* | The password in `DATABASE_URL` is wrong. See [First start](#3-first-start-connect-to-postgresql). |
| *PostgreSQL is not running* | Open **Services** (`services.msc`), find *postgresql-x64-…* and click **Start**. |
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
