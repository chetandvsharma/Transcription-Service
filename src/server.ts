import "dotenv/config";
import http from "http";
import connectDB from "./config/mongodb.js";
import app from "./app";

// ===== Validate ENV Variables =====
const requiredEnv = ["MONGO_URI", "PORT"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const PORT = Number(process.env.PORT) || 8081;

let server: http.Server;

// ===== Graceful Shutdown =====
const gracefulShutdown = () => {
  console.log("Gracefully shutting down...");

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  }

  setTimeout(() => {
    console.error("Forced shutdown");
    process.exit(1);
  }, 10000);
};

// On OS signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// For unhandled fatal errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  gracefulShutdown();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown();
});

// ===== Start Server =====
async function startServer() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
