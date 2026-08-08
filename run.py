#!/usr/bin/env python3
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print("=" * 60)
    print("🚀 Starting AI Image Intelligence System")
    print(f"🌐 Server running on port: {port}")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
