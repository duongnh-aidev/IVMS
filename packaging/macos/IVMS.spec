# PyInstaller spec for IVMS.app. Run through scripts/build_macos.sh, which first builds the frontend,
# downloads MediaMTX into build/macos/ and renders the icon.
import tomllib
from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules, copy_metadata

ROOT = Path(SPECPATH).resolve().parents[1]
BUILD = ROOT / "build" / "macos"
VERSION = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["version"]

a = Analysis(
    [str(ROOT / "packaging" / "desktop" / "launcher.py")],
    pathex=[str(ROOT / "backend")],
    datas=[
        (str(ROOT / "frontend" / "dist"), "web"),
        (str(ROOT / "db" / "prisma" / "migrations"), "migrations"),
        (str(ROOT / "deploy" / "docker" / "mediamtx.yml"), "."),
        *copy_metadata("ivms"),  # /system/health reports the version
    ],
    binaries=[(str(BUILD / "mediamtx"), "bin")],
    # Imported by name at runtime (uvicorn picks its loop/protocol modules; routers are imported lazily)
    hiddenimports=collect_submodules("ivms") + collect_submodules("uvicorn"),
    excludes=["tkinter", "pytest"],
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="IVMS",
    console=False,
    argv_emulation=False,
)
coll = COLLECT(exe, a.binaries, a.datas, name="IVMS")
app = BUNDLE(
    coll,
    name="IVMS.app",
    icon=str(BUILD / "IVMS.icns"),
    bundle_identifier="vn.ivms.desktop",
    version=VERSION,
    info_plist={
        "CFBundleDisplayName": "IVMS",
        "CFBundleShortVersionString": VERSION,
        "LSMinimumSystemVersion": "12.0",
        "NSHighResolutionCapable": True,
        # The window loads the bundled server over http://127.0.0.1
        "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True},
        # Cameras are on the local network (macOS 15+ asks the user once)
        "NSLocalNetworkUsageDescription": "IVMS connects to the cameras on your network.",
    },
)
