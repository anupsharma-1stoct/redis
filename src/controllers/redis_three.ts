import express from "express";
const axios = require("axios");
const redis = require("redis");

const app = express();
const port = process.env.PORT || 3000;

let redisClient: any;
redisClient = redis.createClient();

/*(async () => {

redisClient = redis.createClient();

  redisClient.on("error", (error: any) => console.error(`Error : ${error}`));

  redisClient.on("ready", () => {
    console.log("Redis client is ready");
  });

  // redisClient.on("connect", () => {
  //   console.log("Connected to Redis");
  // });

  await redisClient.connect();

  await redisClient.ping();
})(); */

async function fetchApiData(species: any) {
  const apiResponse = await axios.get(
    `https://www.fishwatch.gov/api/species/${species}`
  );
  console.log("Request sent to the API");
  return apiResponse.data;
}

async function cacheData(req: any, res: any, next: any) {
  const species = req.params.species;
  let results;
  try {
    const cacheResults = await redisClient.get(species);
    console.log(`Checking cache for species:---- ${cacheResults}`);
    if (cacheResults) {
      results = JSON.parse(cacheResults);
      res.send({
        fromCache: true,
        data: results,
      });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404);
  }
}
async function getSpeciesData(req: any, res: any) {
  const species = req.params.species;
  let results;

  try {
    results = await fetchApiData(species);
    console.log(`Fetching data for species: ${results}`);

    if (results.length === 0) {
      res.status(500).json({ error: "An error occurred while fetching data." });
    }
    await redisClient.set(species, JSON.stringify(results), {
      EX: 20, // Set expiration time to 20 seconds
      NX: true, // Set expiration time to 20 seconds and only set if key does not exist
    });

    res.send({
      fromAPI: true,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("Data unavailable");
  }
}

app.get("/fish/:species", cacheData, getSpeciesData);

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  redisClient.on("error", (error: any) => console.error(`Error : ${error}`));

  redisClient.on("ready", () => {
    console.log("Redis client is ready");
  });

  // redisClient.on("connect", () => {
  //   console.log("Connected to Redis");
  // });

  await redisClient.connect();

  const pong = await redisClient.ping(); // Purpose: Sends a test command to check if the Redis server is responsive. Should return 'PONG'
  console.log("Redis says:", pong); // Output: Redis says: PONG
});
