# models.py - database table definitions
from sqlalchemy import Column, Integer, String
from database import Base

class AdminModel(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, unique=True, index=True)
    setting_value = Column(String)
