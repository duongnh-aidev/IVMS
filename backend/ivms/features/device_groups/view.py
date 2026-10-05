from typing import Annotated
from uuid import UUID

from pydantic import StringConstraints

from ivms.core.schemas import ApiModel

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class DeviceGroupCreate(ApiModel):
    name: Name
    parent_id: UUID | None = None


class DeviceGroupUpdate(ApiModel):
    """Omitted fields are unchanged; `parentId: null` moves the group to the top level."""

    name: Name | None = None
    parent_id: UUID | None = None


class DeviceGroup(ApiModel):
    id: UUID
    name: str
    parent_id: UUID | None
    depth: int
    # Devices in this group and all its sub-groups
    device_count: int
