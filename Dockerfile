# 🐍 Use official Python base image
FROM python:3.12-slim

# 📁 Set working directory inside container
WORKDIR /app

# 🚫 Avoid .pyc files & enable instant logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ⚙️ Install system dependencies (needed for PostgreSQL) 
#libpq-dev is the key package that provides PostgreSQL client libraries for Python
RUN apt-get update && apt-get install -y \   
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 📦 Copy dependency list and install them
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 📂 Copy all project files into container
COPY . .

# 🌍 Expose Django’s default port
EXPOSE 8000

# 🏃‍♀️ Run Django’s built-in development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
