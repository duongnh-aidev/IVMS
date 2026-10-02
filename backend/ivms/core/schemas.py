"""Base models shared by every feature's request/response schemas."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class ApiModel(BaseModel):
    """camelCase on the wire, snake_case in Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Page(ApiModel, Generic[T]):
    """Offset-paginated list response."""

    items: list[T]
    total: int
    limit: int
    offset: int
