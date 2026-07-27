import express from "express";
import Redis from "redis";

const client = Redis.createClient({
    url: "redis://redis:6379" // 'redis' = Docker service name
})

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

const PORT = 4000;

(async()=>{
    if (!client.isOpen) { 
        client.on("ready", () => {
        console.log("Redis client is ready");
        });
    
        await client.connect();
    
        const pong = await  client.ping(); // Purpose: Sends a test command to check if the Redis server is responsive. Should return 'PONG'
        console.log("Redis says:", pong); // Output: Redis says: PONG
    }
})();

const QUEUE_KEY= "queue:email";

app.post("/email", async(req:any, res:any)=>{
    const {to, subject, body} = req.body;
    const job = {
        to,
        subject,
        body,
        createdAt: new Date().toISOString()
    }

    const result = await client.lPush(QUEUE_KEY, JSON.stringify(job));

    console.log("Result:", result);
    
    if (result && !isNaN(result)) {
        return res.status(200).json({queue: true, job});
    }

    return res.status(400).json({msg: 'Failed to add in queue!'});
});

app.get("/email/process-one", async(req:any, res:any)=>{
    const rawJob = await client.rPop(QUEUE_KEY);
    if (!rawJob) {
        return res.status(400).json({msg: "No job in the queue!"});    
    }

    return res.status(200).json({msg: "Email sent!", job: JSON.parse(rawJob)});
});

app.listen(PORT, async()=>{
    console.log(`Server running at ${PORT}!`);
});