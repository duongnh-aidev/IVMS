"""RTSP probe against a tiny in-process RTSP server that requires Digest auth."""

import asyncio
import hashlib
import re

import pytest

from ivms.features.streams import RtspTarget, probe

SDP = "v=0\r\nm=video 0 RTP/AVP 96\r\na=rtpmap:96 H264/90000\r\n"
REALM, NONCE = "IP Camera", "abc123"


def _md5(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()


@pytest.fixture
async def camera():
    """Yields the port of a server accepting admin / secret on /stream."""

    async def handle(reader, writer):
        while True:
            head = []
            while (line := (await reader.readline()).decode()) not in ("\r\n", ""):
                head.append(line.strip())
            if not head:
                break
            method, uri, _ = head[0].split()
            cseq = next(h for h in head if h.startswith("CSeq")).split(":")[1].strip()
            auth = next((h for h in head if h.startswith("Authorization")), "")
            m = re.search(r'response="(\w+)"', auth)
            expected = _md5(f"{_md5(f'admin:{REALM}:secret')}:{NONCE}:{_md5(f'{method}:{uri}')}")
            if not uri.endswith("/stream"):
                writer.write(f"RTSP/1.0 404 Not Found\r\nCSeq: {cseq}\r\n\r\n".encode())
            elif m and m.group(1) == expected:
                writer.write(
                    f"RTSP/1.0 200 OK\r\nCSeq: {cseq}\r\nContent-Length: {len(SDP)}\r\n\r\n{SDP}".encode()
                )
            else:
                writer.write(
                    f'RTSP/1.0 401 Unauthorized\r\nCSeq: {cseq}\r\n'
                    f'WWW-Authenticate: Digest realm="{REALM}", nonce="{NONCE}"\r\n\r\n'.encode()
                )
            await writer.drain()
        writer.close()

    server = await asyncio.start_server(handle, "127.0.0.1", 0)
    yield server.sockets[0].getsockname()[1]
    server.close()


async def test_digest_auth_and_codec(camera):
    result = await probe(RtspTarget("127.0.0.1", camera, "/stream", "admin", "secret"))

    assert result.reachable
    assert result.codec == "H.264"


async def test_wrong_password(camera):
    result = await probe(RtspTarget("127.0.0.1", camera, "/stream", "admin", "nope"))

    assert not result.reachable
    assert result.error == "Wrong username or password"


async def test_unknown_path(camera):
    result = await probe(RtspTarget("127.0.0.1", camera, "/other", "admin", "secret"))

    assert result.error == "Stream path not found on the camera"


async def test_nothing_listening():
    result = await probe(RtspTarget("127.0.0.1", 1, "/"), timeout=1)

    assert not result.reachable
    assert result.error.startswith("Cannot connect")


def test_url_escapes_credentials():
    t = RtspTarget("10.0.0.1", 554, "/s", "ad min", "p@ss")

    assert t.url == "rtsp://ad%20min:p%40ss@10.0.0.1:554/s"
    assert t.public_url == "rtsp://10.0.0.1:554/s"
