"""RTSP helpers: build camera URLs and check that a stream answers before saving a device."""

import asyncio
import base64
import hashlib
import re
from dataclasses import dataclass
from urllib.parse import quote

PROBE_TIMEOUT_S = 4.0
# SDP "a=rtpmap:96 H264/90000" → H264
_RTPMAP = re.compile(r"^a=rtpmap:\d+ ([A-Za-z0-9-]+)/", re.MULTILINE)
_CODEC_NAMES = {"H264": "H.264", "H265": "H.265", "HEVC": "H.265", "JPEG": "MJPEG"}


@dataclass(frozen=True)
class RtspTarget:
    host: str
    port: int
    path: str
    username: str = ""
    password: str = ""

    @property
    def public_url(self) -> str:
        """URL without credentials (for RTSP request lines and logs)."""
        return f"rtsp://{self.host}:{self.port}{self.path or '/'}"

    @property
    def url(self) -> str:
        """URL with credentials (for MediaMTX to pull from)."""
        if not self.username:
            return self.public_url
        auth = quote(self.username, safe="") + ":" + quote(self.password, safe="")
        return f"rtsp://{auth}@{self.host}:{self.port}{self.path or '/'}"


@dataclass(frozen=True)
class ProbeResult:
    reachable: bool
    codec: str | None = None
    error: str | None = None


async def probe(target: RtspTarget, timeout: float = PROBE_TIMEOUT_S) -> ProbeResult:
    """Sends RTSP DESCRIBE (with Basic or Digest auth) and reads the video codec from the SDP."""
    try:
        return await asyncio.wait_for(_describe(target), timeout)
    except TimeoutError:
        return ProbeResult(False, error="The camera did not answer in time")
    except OSError as e:
        return ProbeResult(False, error=f"Cannot connect to {target.host}:{target.port} ({e.strerror or e})")
    except ValueError as e:
        return ProbeResult(False, error=str(e))


async def _describe(t: RtspTarget) -> ProbeResult:
    reader, writer = await asyncio.open_connection(t.host, t.port)
    try:
        status, headers, body = await _request(reader, writer, t, cseq=1, auth=_basic(t))
        if status == 401 and t.username and "digest" in headers.get("www-authenticate", "").lower():
            auth = _digest(t, headers["www-authenticate"])
            status, headers, body = await _request(reader, writer, t, cseq=2, auth=auth)
    finally:
        writer.close()

    if status == 200:
        m = _RTPMAP.search(body)
        codec = _CODEC_NAMES.get(m.group(1).upper(), m.group(1)) if m else None
        return ProbeResult(True, codec=codec)
    if status == 401:
        return ProbeResult(False, error="Wrong username or password")
    if status == 404:
        return ProbeResult(False, error="Stream path not found on the camera")
    return ProbeResult(False, error=f"Camera answered RTSP {status}")


async def _request(reader, writer, t: RtspTarget, cseq: int, auth: str | None) -> tuple[int, dict, str]:
    lines = [f"DESCRIBE {t.public_url} RTSP/1.0", f"CSeq: {cseq}", "Accept: application/sdp", "User-Agent: IVMS"]
    if auth:
        lines.append(f"Authorization: {auth}")
    writer.write(("\r\n".join(lines) + "\r\n\r\n").encode())
    await writer.drain()

    status_line = (await reader.readline()).decode(errors="replace")
    parts = status_line.split()
    if len(parts) < 2 or not parts[0].startswith("RTSP/"):
        raise ValueError("Not an RTSP server")
    headers: dict[str, str] = {}
    while line := (await reader.readline()).decode(errors="replace").strip():
        key, _, value = line.partition(":")
        headers[key.strip().lower()] = value.strip()
    length = int(headers.get("content-length", 0))
    body = (await reader.readexactly(length)).decode(errors="replace") if length else ""
    return int(parts[1]), headers, body


def _basic(t: RtspTarget) -> str | None:
    if not t.username:
        return None
    return "Basic " + base64.b64encode(f"{t.username}:{t.password}".encode()).decode()


def _digest(t: RtspTarget, challenge: str) -> str:
    params = dict(re.findall(r'(\w+)="([^"]*)"', challenge))
    realm, nonce = params.get("realm", ""), params.get("nonce", "")

    def md5(s: str) -> str:
        return hashlib.md5(s.encode()).hexdigest()  # RTSP digest auth is defined on MD5

    ha1 = md5(f"{t.username}:{realm}:{t.password}")
    ha2 = md5(f"DESCRIBE:{t.public_url}")
    response = md5(f"{ha1}:{nonce}:{ha2}")
    return (
        f'Digest username="{t.username}", realm="{realm}", nonce="{nonce}", '
        f'uri="{t.public_url}", response="{response}"'
    )
