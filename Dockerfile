# 🐍 Use official Python base image
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ⚙️ System deps for PostgreSQL + Pillow
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    zlib1g-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libtiff-dev \
    libopenjp2-7-dev \
 && rm -rf /var/lib/apt/lists/*

# 📦 Dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 📂 Project
COPY . .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
