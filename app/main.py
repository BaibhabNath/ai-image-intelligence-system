import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from app.api.endpoints import router as api_router

load_dotenv()

app = FastAPI(
    title="AI Image Intelligence System API",
    description="Enterprise REST service for automated multi-dimensional image understanding, layout-aware OCR, scenario detection, content moderation, and human-in-the-loop audit.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

# Mount static files directory for web UI
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
async def serve_dashboard():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "AI Image Intelligence System API is running. Access documentation at /docs"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Image Intelligence System",
        "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY"))
    }
