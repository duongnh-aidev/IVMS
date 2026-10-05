# PyInstaller spec for IVMS.exe (Windows, one folder). Run through scripts/build_windows.ps1, which first builds
# the frontend and downloads MediaMTX into build/windows/. installer.iss then packs the folder into a setup .exe.
import tomllib
from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules, copy_metadata

ROOT = Path(SPECPATH).resolve().parents[1]
BUILD = ROOT / "build" / "windows"
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
    binaries=[(str(BUILD / "mediamtx.exe"), "bin")],
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
    icon=str(ROOT / "packaging" / "windows" / "icon.ico"),
    console=False,
)
coll = COLLECT(exe, a.binaries, a.datas, name="IVMS")
