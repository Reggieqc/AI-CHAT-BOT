import express from "express";
import cors from "cors";
import chatRouter from './src/chatRouter.js';

//Create Express app
const app = express();

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use('/api', chatRouter);

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;