import { createClient } from "redis";

const client = createClient({
    url: "redis://redis:6379" // 'redis' = Docker service name
});

const redis_connection = async () =>{
    client.on("error", (err) => console.error("❌ Redis Client Error:", err));
    
    if (!client.isOpen) { 
      client.on("error", (error: any) => console.error(`Error : ${error}`));
    
      client.on("ready", () => {
        console.log("Redis client is ready");
      });
    
      await client.connect();
    
      const pong = await  client.ping(); // Purpose: Sends a test command to check if the Redis server is responsive. Should return 'PONG'
      console.log("Redis says:", pong); // Output: Redis says: PONG
    }
}

export {redis_connection, client};