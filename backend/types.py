"""
Type definitions for RHACbot backend API
Matches the TypeScript types defined in rhacbot-next/lib/types.ts
and the OpenAPI specification in openapi.yaml
"""
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Literal, Union
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class Region(str, Enum):
    """Valid region names for buildings"""
    NORTH = "North"
    SOUTH = "South"
    WEST = "West"


class RegionTarget(str, Enum):
    """Valid region targeting options (includes 'all' for message broadcasting)"""
    ALL = "all"
    NORTH = "North"
    SOUTH = "South"
    WEST = "West"


# ============================================================================
# Common Types
# ============================================================================

@dataclass
class ApiError:
    """Standard error response from the API"""
    error: str
    details: Optional[str] = None

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}


# ============================================================================
# Building Types
# ============================================================================

@dataclass
class Building:
    """Building information from the database"""
    id: int  # 0-40
    name: str
    address: str
    region: str  # Region enum value

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data['id'],
            name=data['name'],
            address=data['address'],
            region=data['region']
        )


# ============================================================================
# Health Check Types
# ============================================================================

@dataclass
class HealthCheckResponse:
    """Response from the health check endpoint"""
    status: Literal["ok"]
    message: str

    def to_dict(self):
        return asdict(self)


# ============================================================================
# Chat Management Types
# ============================================================================

@dataclass
class AddChatRequest:
    """Request payload for adding a floor chat"""
    groupme_link: str
    building_id: int  # 0-40
    floor_number: int  # minimum: 1

    def validate(self) -> Optional[str]:
        """Validate the request data. Returns error message if invalid, None if valid."""
        if not self.groupme_link or not self.groupme_link.strip():
            return "groupme_link is required"
        if not isinstance(self.building_id, int) or self.building_id < 0 or self.building_id > 40:
            return "building_id must be an integer between 0 and 40"
        if not isinstance(self.floor_number, int) or self.floor_number < 1:
            return "floor_number must be a positive integer"
        return None

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            groupme_link=data.get('groupme_link', ''),
            building_id=int(data.get('building_id', -1)),
            floor_number=int(data.get('floor_number', 0))
        )


@dataclass
class AddChatResponse:
    """Response from adding a chat"""
    message: str
    chat_id: Optional[str] = None

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v is not None}


# ============================================================================
# Authentication Types
# ============================================================================

@dataclass
class AuthRequest:
    """Request payload for authentication"""
    password: str

    @classmethod
    def from_dict(cls, data: dict):
        return cls(password=data.get('password', ''))


@dataclass
class AuthResponse:
    """Response from authentication"""
    message: str

    def to_dict(self):
        return asdict(self)


@dataclass
class AuthErrorResponse:
    """Error response from authentication"""
    error: str

    def to_dict(self):
        return asdict(self)


# ============================================================================
# Message Broadcasting Types
# ============================================================================

@dataclass
class MessageSendSummary:
    """Summary of message sending results"""
    total: int
    sent: int
    failed: int

    def to_dict(self):
        return asdict(self)


@dataclass
class MessageFailure:
    """Information about a failed message delivery"""
    chat_id: str
    building: str
    floor: int
    error: str

    def to_dict(self):
        return asdict(self)


@dataclass
class SendMessageSuccessResponse:
    """Response from sending messages (all successful)"""
    message: str
    summary: MessageSendSummary

    def to_dict(self):
        return {
            'message': self.message,
            'summary': self.summary.to_dict()
        }


@dataclass
class SendMessagePartialResponse:
    """Response from sending messages (partial failure)"""
    message: str
    summary: MessageSendSummary
    failures: List[MessageFailure] = field(default_factory=list)

    def to_dict(self):
        return {
            'message': self.message,
            'summary': self.summary.to_dict(),
            'failures': [f.to_dict() for f in self.failures]
        }


# SendMessageResponse is a Union type: SendMessageSuccessResponse | SendMessagePartialResponse | ApiError
SendMessageResponse = Union[SendMessageSuccessResponse, SendMessagePartialResponse, ApiError]


# ============================================================================
# Validation Helpers
# ============================================================================

def is_valid_region(region: str) -> bool:
    """Check if a region string is valid"""
    return region in [r.value for r in Region]


def is_valid_region_target(region: str) -> bool:
    """Check if a region target string is valid (includes 'all')"""
    return region in [r.value for r in RegionTarget]


def is_valid_building_id(building_id: int) -> bool:
    """Check if building ID is in valid range (0-40)"""
    return isinstance(building_id, int) and 0 <= building_id <= 40


def validate_message_body(message_body: str) -> Optional[str]:
    """Validate message body. Returns error message if invalid, None if valid."""
    if not message_body or not message_body.strip():
        return "message_body is required"
    if len(message_body) > 1000:
        return "message_body must be 1000 characters or less"
    return None
