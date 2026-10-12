from typing import Literal

from ivms.core.schemas import ApiModel


class Health(ApiModel):
    status: Literal["ok"]
    version: str


class Info(ApiModel):
    version: str
    # Community, or the edition of a plugin while it has features enabled
    edition: str
    # Feature keys plugins have enabled right now (the UI shows plugin screens for these)
    features: list[str]
