# api/Dockerfile
FROM python:3.11-slim

# Prevent Python from writing pyc files and keep stdout unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for building Python packages like psycopg
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the Flask application code
COPY . .

# Expose the Flask port
EXPOSE 3018

# Use Gunicorn for production (adjust workers based on your host machine)
CMD ["gunicorn", "--bind", "0.0.0.0:3018", "--workers", "4", "--threads", "4", "app:app"]