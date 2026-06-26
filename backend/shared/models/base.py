# base.py - shared base model all modules inherit from
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from database import Base

class SharedBaseModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())



