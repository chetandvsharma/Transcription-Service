# Transcription Service API

A production-ready Node.js + TypeScript + MongoDB backend, fully containerized with Docker.

**Works on Windows, Mac, and Linux — no Node.js or MongoDB installation required!**

## Prerequisites (only one thing)

Install **Docker Desktop** (free):

- Windows & Mac → https://www.docker.com/products/docker-desktop/
- Linux → https://docs.docker.com/engine/install/

That’s it. You don’t need Node.js, MongoDB, or anything else.

## How to Run (3 commands only)

```bash
# 1. Clone the project
git clone https://github.com/chetandvsharma/Transcription-Service.git
cd transcription-service

# 2. Start everything (API + MongoDB)
docker compose up --build -d

# 3. Wait 30–60 seconds, then open:
http://localhost:8080