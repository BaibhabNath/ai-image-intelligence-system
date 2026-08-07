#!/usr/bin/env python3
import sys
import subprocess
import os

# Auto-verify and install dependencies if missing in current Python environment
try:
    import uvicorn
    import fastapi
    import PIL
    import google.genai
except ImportError:
    print("📦 Installing required dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print("=" * 60)
    print("🚀 Starting AI Image Intelligence System")
    print(f"🌐 Server running at: http://localhost:{port}")
    print(f"📖 API Swagger Docs: http://localhost:{port}/docs")
    print(f"🛡️  Human Review Queue: http://localhost:{port}/#review")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
