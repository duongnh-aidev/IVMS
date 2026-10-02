"""Live streams: MediaMTX relay paths and RTSP probing. Live URL endpoints come later (docs §4.6)."""

from .mediamtx import MediaMTX
from .rtsp import ProbeResult, RtspTarget, probe


def path_name(device_id) -> str:
    """MediaMTX path of a device: what the browser (WebRTC/HLS) and the AI service (RTSP) open."""
    return f"cam-{device_id}"


__all__ = ["MediaMTX", "ProbeResult", "RtspTarget", "path_name", "probe"]
