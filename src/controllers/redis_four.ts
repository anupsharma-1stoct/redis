const redis = require("redis");
import express from "express";
const app = express();

const redisClient = redis.createClient({
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 5) {
        return new Error("Too many retries");
      }
      return Math.min(retries * 100, 5000); // wait up to 5 seconds
    },
  },
});

// const redisClient = redis.createClient();

// Middleware to check the cache before fetching data
const checkCache = async (req: any, res: any, next: any) => {
  const key = req.path;
  const cacheResults = await redisClient.get(key);

  let results;
  if (cacheResults) {
    console.log(`From Cache for key: ${key}`);
    results = JSON.parse(cacheResults);
    res.send({
      fromCache: true,
      data: results,
    });
  } else {
    next(); // Proceed to the next middleware or route handler
  }
};

// Endpoint for fetching data with caching
app.get("/api/users/redis_four", checkCache, async (req: any, res: any) => {
  // This code will only execute if the data is not in the cache
  const key = req.path;
  console.log(`From API for key: ${key}`);
  const response = await fetch("https://jsonplaceholder.typicode.com/users/");
  const results = await response.json();
  redisClient.setEx(key, 20, JSON.stringify(results));
  res.json({ fromAPI: true, data: results });
});

process.on("SIGINT", async () => {
  // Handles graceful shutdown on SIGINT (Ctrl+C)
  console.log(" Redis server shutting down...");
  await redisClient.quit(); // Close the Redis client connection gracefully
  console.log("Redis client connection closed!");
  process.exit(0);
});
// Start the server
const PORT = 3000;
app.listen(PORT, async () => {
  if (!redisClient.isOpen) {
    redisClient.on("error", (error: any) => console.error(`Error : ${error}`));

    redisClient.on("ready", () => {
      console.log("Redis client is ready");
    });

    await redisClient.connect();

    const pong = await redisClient.ping(); // Purpose: Sends a test command to check if the Redis server is responsive. Should return 'PONG'
    console.log("Redis says:", pong); // Output: Redis says: PONG
  }

  console.log(`Server is running on port ${PORT}`);
});
