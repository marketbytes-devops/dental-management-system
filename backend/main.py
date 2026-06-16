# main.py - Single entry point, everyone's routers register here
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from modules (to be implemented)
# from modules.auth.router import router as auth_router
# from modules.doctor.router import router as doctor_router

app = FastAPI(title="SmileCare Dental Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SmileCare Dental CRM backend API"}
