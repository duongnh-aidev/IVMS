"""Downloads the PostgreSQL server bundled in the desktop app and trims it to what IVMS runs.

    python packaging/desktop/prepare_postgres.py darwin-arm64v8 build/macos/postgres
    python packaging/desktop/prepare_postgres.py windows-amd64 build/windows/postgres

Binaries: relocatable PostgreSQL builds from io.zonky.test.postgres (Maven Central), checked against the
SHA-256 below. Output: <out>/bin (initdb, pg_ctl, postgres), <out>/lib, <out>/share.
"""

import io
import shutil
import subprocess
import sys
import tarfile
import urllib.request
import zipfile
from hashlib import sha256
from pathlib import Path

VERSION = "17.11.0"
SHA256 = {
    "darwin-arm64v8": "a1c2786acb0c398f9b2d76806fc52f5dc8b222cbc8e9383a9b9702084daaf3a5",
    "darwin-amd64": "d464ff178e9860ba204662ac23fa547504b7fd392392ff2fb92e3fd73b5bdb64",
    "windows-amd64": "98040fae18dd9633ff95932125b0cecf0a45a1a9312e216e2a33ad03a31d4251",
}
URL = "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-{p}/{v}/embedded-postgres-binaries-{p}-{v}.jar"
SERVER_PROGRAMS = ("initdb", "pg_ctl", "postgres")


def download(platform: str, cache: Path) -> bytes:
    jar = cache / f"embedded-postgres-binaries-{platform}-{VERSION}.jar"
    if not jar.exists():
        print(f"Downloading PostgreSQL {VERSION} ({platform})")
        with urllib.request.urlopen(URL.format(p=platform, v=VERSION)) as r:
            jar.write_bytes(r.read())
    data = jar.read_bytes()
    if sha256(data).hexdigest() != SHA256[platform]:
        jar.unlink()
        sys.exit(f"PostgreSQL checksum mismatch for {platform}")
    return data


def extract(jar: bytes, dest: Path) -> None:
    with zipfile.ZipFile(io.BytesIO(jar)) as z:
        txz = next(n for n in z.namelist() if n.endswith(".txz"))
        with tarfile.open(fileobj=io.BytesIO(z.read(txz)), mode="r:xz") as t:
            t.extractall(dest, filter="data")


def trim_macos(src: Path, out: Path, arch: str) -> None:
    """Copies the server programs, the modules in lib/postgresql and the libraries they load, for one arch."""
    (out / "bin").mkdir(parents=True)
    for name in SERVER_PROGRAMS:
        shutil.copy2(src / "bin" / name, out / "bin" / name)
    shutil.copytree(src / "lib" / "postgresql", out / "lib" / "postgresql")
    shutil.copytree(src / "share", out / "share")
    # Libraries are referenced as @rpath/<name> (rpath: @loader_path/../lib); follow them transitively
    todo = [*(out / "bin").iterdir(), *(out / "lib" / "postgresql").glob("*.dylib")]
    while todo:
        deps = subprocess.run(["otool", "-L", str(todo.pop())], capture_output=True, text=True, check=True).stdout
        for line in deps.splitlines()[1:]:
            ref = line.strip().split(" ")[0]
            name = ref.removeprefix("@rpath/")
            # Missing upstream for a few optional modules (e.g. xml2 -> libxslt), which IVMS does not use
            if ref.startswith("@rpath/") and not (out / "lib" / name).exists() and (src / "lib" / name).exists():
                shutil.copy2(src / "lib" / name, out / "lib" / name)
                todo.append(out / "lib" / name)
    # Universal (x86_64 + arm64) -> the arch of this build
    for f in out.rglob("*"):
        if (
            f.is_file()
            and "universal" in subprocess.run(["file", str(f)], capture_output=True, text=True, check=True).stdout
        ):
            subprocess.run(["lipo", str(f), "-thin", arch, "-output", str(f)], check=True)
    # Upstream ships symlinked names (libicudata.68.dylib -> libicudata.68.2.dylib) as copies: link them again
    seen: dict[str, Path] = {}
    for f in sorted((out / "lib").glob("*.dylib"), key=lambda p: (-len(p.name), p.name)):
        digest = sha256(f.read_bytes()).hexdigest()
        if digest in seen:
            f.unlink()
            f.symlink_to(seen[digest].name)
        else:
            seen[digest] = f


def trim_windows(src: Path, out: Path) -> None:
    """Drops pgAdmin / client-only DLLs, link libraries and translations."""
    skip_dll = ("wx", "testplug", "libecpg", "libpgtypes")
    (out / "bin").mkdir(parents=True)
    for f in (src / "bin").iterdir():
        if f.stem in SERVER_PROGRAMS or (f.suffix == ".dll" and not f.name.startswith(skip_dll)):
            shutil.copy2(f, out / "bin" / f.name)
    (out / "lib").mkdir()
    for f in (src / "lib").glob("*.dll"):
        shutil.copy2(f, out / "lib" / f.name)
    shutil.copytree(src / "share", out / "share", ignore=shutil.ignore_patterns("locale"))


def main() -> None:
    platform, out = sys.argv[1], Path(sys.argv[2])
    work = out.parent / f"postgres-{platform}-{VERSION}"
    work.mkdir(parents=True, exist_ok=True)
    src = work / "full"
    if not (src / "bin").exists():
        extract(download(platform, work), src)
    shutil.rmtree(out, ignore_errors=True)
    if platform.startswith("darwin"):
        trim_macos(src, out, "arm64" if platform == "darwin-arm64v8" else "x86_64")
    else:
        trim_windows(src, out)
    size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"PostgreSQL {VERSION} -> {out} ({size / 1e6:.0f} MB)")


if __name__ == "__main__":
    main()
