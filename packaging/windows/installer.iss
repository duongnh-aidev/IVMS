; Inno Setup script: packs dist/windows/IVMS (PyInstaller output) into IVMS-<version>-x64-setup.exe.
; Run through scripts/build_windows.ps1, which passes /DAppVersion=<version>.
; PostgreSQL and MediaMTX are bundled; IVMS.exe starts and stops them.

#ifndef AppVersion
  #error Pass /DAppVersion=<version>
#endif
#define Root AddBackslash(SourcePath) + "..\.."

[Setup]
; Fixed: identifies the app for upgrades and uninstall. Never change it.
AppId={{6F1C2B0E-6B7A-4F0B-9C55-2E9E4C1A7D31}
AppName=IVMS
AppVersion={#AppVersion}
AppPublisher=IVMS contributors
AppPublisherURL=https://github.com/duongnh-aidev/IVMS
AppSupportURL=https://github.com/duongnh-aidev/IVMS/issues
DefaultDirName={autopf}\IVMS
DefaultGroupName=IVMS
DisableProgramGroupPage=yes
LicenseFile={#Root}\LICENSE
OutputDir={#Root}\dist\windows
OutputBaseFilename=IVMS-{#AppVersion}-x64-setup
SetupIconFile={#Root}\packaging\windows\icon.ico
UninstallDisplayIcon={app}\IVMS.exe
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
PrivilegesRequiredOverridesAllowed=dialog
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; IVMS must be closed to upgrade it
CloseApplications=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#Root}\dist\windows\IVMS\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\IVMS"; Filename: "{app}\IVMS.exe"
Name: "{autodesktop}\IVMS"; Filename: "{app}\IVMS.exe"; Tasks: desktopicon

[Run]
; As the signed-in user, not the elevated installer: the bundled PostgreSQL refuses to run as administrator
Filename: "{app}\IVMS.exe"; Description: "{cm:LaunchProgram,IVMS}"; Flags: nowait postinstall skipifsilent runasoriginaluser

; Settings (%APPDATA%\IVMS) and the database (%LOCALAPPDATA%\IVMS) are kept on uninstall, so a reinstall
; keeps cameras and users.
