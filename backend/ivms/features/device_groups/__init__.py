"""Device groups: the site / building / floor tree devices are filed under (docs §4.4)."""

from .router import router
from .service import DeviceGroupService

__all__ = ["DeviceGroupService", "router"]
