# pagination.py - shared database query pagination utility
from typing import List, Any
from pydantic import BaseModel

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int

def paginate_query(query, page: int = 1, size: int = 20) -> dict:
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}
