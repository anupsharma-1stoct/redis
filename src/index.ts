import axios from "axios";
import express from "express";
import type { Request, Response } from "express";
import redis_one_controller from "./controllers/redis_one.ts";
import { redis_connection, client } from "./redis_client.ts";

const app = express();
app.use(express.json());

/* User APIs */
app.use("/redis_one", redis_one_controller);

client.on("error", (err) => console.error("❌ Redis Client Error:", err));

const port = process.env.PORT || 3000;

async function fetchApiData(species: any) {
  const apiResponse = await axios.get(
    `https://www.fishwatch.gov/api/species/${species}`
  );
  console.log("Request sent to the API");
  return apiResponse.data;
}

async function getSpeciesData(req: Request, res: Response) {
  const species = req.params.species;
  let results;

  try {
    results = await fetchApiData(species);
    if (results.length === 0) {
      throw "API returned an empty array";
    }
    res.send({
      fromCache: false,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("Data unavailable");
  }
}

app.get("/fish/:species", getSpeciesData);

app.listen(port, async () => {

  await redis_connection(); 

  const PORT = 3000;
  console.log(`Server is running on port ${PORT}`);
});
