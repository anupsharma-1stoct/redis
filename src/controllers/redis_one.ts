import axios from "axios";
import express, {Router} from "express";
import type {Request, Response } from "express";
import {client } from "../redis_client.ts";
const router = Router();
const USERS_API = "https://jsonplaceholder.typicode.com/users/";

// const client = createClient({
//   socket: {
//     host: "localhost", // or actual IP
//     port: 6379, // or your custom port
//   },
// });


router.get("/users", async (req: Request, res: Response) => {
  try {
    await client.connect();
    axios.get(`${USERS_API}`).then(function (response: any) {
      const users = response.data;
      console.log("Users retrieved from the API");
      return res.status(200).send(users);
    });
  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/cached-users", async (req: Request, res: Response) => {
  try {
    const cached = await client.get("users");
    if (cached) {
      console.log("Users retrieved from Redis cache!");
      res.status(200).send(JSON.parse(cached));
      return;
    }

    const response = await axios.get(`${USERS_API}`);
    const users = response.data;
    await client.setEx("users", 600, JSON.stringify(users));
    console.log("Users retrieved from the API!");
    res.status(200).send(users);
    return;
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ error: error.message || error });
  }
});

router.get('/delete', async (req: Request, res: Response) => {
  try {
    const result = await client.del('users');
    if (result === 1) {
      console.log('Cache for users deleted successfully');
      res.status(200).send({ message: 'Cache for users deleted successfully' });
      return;
    } else {
      console.log('No cache found for users to delete');
      res.status(404).send({ message: 'No cache found for users to delete' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ error: error.message || error });
    return;
  }
});

export default router;