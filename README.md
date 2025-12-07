# Transcription Service API

A production-ready Node.js + TypeScript + MongoDB backend following a clean MVC architecture, fully containerized using Docker. The application separates app logic (app.ts) from bootstrap logic (server.ts) for better scalability and maintainability.

## Code Structure

```bash
src/
├── controllers/ → Handle incoming requests & call services
├── models/ → Mongoose schemas and data models
├── services/ → Business logic (Azure: mock + real SDK services)
├── config/ → Database config
├── routes/
│ ├── index.routes.ts → Main router exporting all feature routes
│ └── transcription.routes.ts → Example module routing
├── app.ts → Express app setup (middlewares, routes)
└── server.ts → Starts server + connects MongoDB
Dockerfile → docker file
docker-compose.yml → compose file

   ```

## Assumptions made
- A dummy URL is passed in the transaction POST API request body.The system mocks the file download and transcription process for demonstration purposes.
- Azure services are mocked because actual Azure keys/credentials are not available. Both the Azure download and transcription logic use mock implementations in the service layer.

## Features
- POST /api/transcription: Accepts audio URL, mocks download and transcription, stores result in MongoDB, returns document ID.
- GET /api/transcriptions: Returns transcriptions from the last 30 days.
- Mocked Azure Speech-to-Text integration in `src/services/azureSpeech.ts`.
- Dockerized for easy setup and sharing.

## Indexing for 100M+ Records
When working with 100M+ documents as mentioned in document, indexing becomes essential to keep queries fast and prevent MongoDB from scanning unnecessary documents and following poins : 

- The query filters on createdAt >= last 30 days.
- The query sorts on createdAt in descending order.
- MongoDB uses _id as a secondary field to maintain stable, efficient ordering.

## Used Index
**transcriptionSchema.index({ createdAt: -1, _id: -1 });**

This compound index ensures that both the filter and sort operations are performed directly using the index, avoiding collection scans or in-memory sorting.

Benefits for 100M+ Documents
- Fast range filtering on createdAt.
- Efficient sorting on large datasets.
- Future-proof for large-scale logs, feeds, or time-series data.

## Scalability & System Design
To scale this service for 10k+ concurrent requests, a few key architectural improvements would make the system more reliable and performant:

1. **A Message Queue (I’ve mostly worked with Redis, and I’m familiar with Kafka as well)**
Instead of processing transcription inside the API request pushes a job to a queue (e.g. Redis, Kafka, RabbitMQ, BullMQ + Redis). Background workers handle the transcription processing asynchronously. This prevents API blocking and keeps latency low even under heavy load.

2. **Horizontal Scaling With Containers (I already Dockerized this application)**
Run the service in Docker and deploy on platforms that support autoscaling (e.g. Kubernetes, AWS ECS, Azure Container Apps)

3. **Caching Layer for Hot Queries**
Use Redis to cache Recent transcriptions (e.g., last 30 days) and Frequently accessed entries

4. **Optimized Database Setup**
Use proper indexing (already added on createdAt and _id) and Enable sharding for extremely large datasets.

5. **Rate limiting**
Rate limiting (e.g., express-rate-limit) to protect the service from spikes or abuse. In addition maintain proper firewall configurations to avoid DDOS style attacks.

## Prerequisites (only one thing)

Install **Docker Desktop** :

- Windows & Mac → https://www.docker.com/products/docker-desktop/
- Linux → https://docs.docker.com/engine/install/

## How to Run (3 commands only)

```bash
# 1. Clone the project
git clone https://github.com/chetandvsharma/Transcription-Service.git
cd transcription-service

# 2. Start everything (API + MongoDB)
docker compose up --build -d

# 3. Wait 30–60 seconds, then open:
http://localhost:8080 or http://your_ip_address:8080
