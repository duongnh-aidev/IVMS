from typing import Literal

from ivms.core.schemas import ApiModel


class Health(ApiModel):
    status: Literal["ok"]
    version: str
