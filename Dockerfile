# Multistage build for optimized production container size
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files & buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI application with Uvicorn binding dynamically to Render's $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
