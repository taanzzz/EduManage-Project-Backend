const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require('http');
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// --- Initialization ---
const app = express();
const server = http.createServer(app);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const port = process.env.PORT || 5000;

// --- Middleware ---
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_LIVE_URL 
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// --- Socket.IO Initialization ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// --- MongoDB Connection ---
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function runDbAndServer() {
  try {
    
    await client.connect();
    const db = client.db("GeminiChatDB");
    const usersCollection = db.collection("users");
    const conversationsCollection = db.collection("conversations");
    
    console.log("✅ MongoDB for Chatbot is successfully connected!");

    // --------------------------- API ENDPOINTS ---------------------------
    
    // JWT & User Management
    app.post("/jwt", async (req, res) => {
      const userInfo = req.body;
      const email = userInfo.email;
      try {
        let user = await usersCollection.findOne({ email });
        if (!user) {
          const newUser = { email, name: userInfo.name, photoURL: userInfo.photoURL, role: 'user', createdAt: new Date() };
          await usersCollection.insertOne(newUser);
          user = newUser;
        }
        const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.send({ token, role: user.role });
      } catch (error) {
        console.error("Error in JWT creation/user sync:", error);
        res.status(500).send({ message: "Server error during authentication." });
      }
    });

    // Middleware to verify JWT token
    const verifyToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ message: "Unauthorized access" });
        }
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: "Forbidden access" });
            }
            req.decoded = decoded;
            next();
        });
    };

    // Chat Endpoints
    app.post('/chat/send-message', verifyToken, async (req, res) => {
      const { history, message } = req.body;
      const userEmail = req.decoded.email;
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const aiResponseText = result.response.text();

        await conversationsCollection.updateOne(
          { userEmail },
          { $push: { messages: { $each: [{ role: 'user', parts: [{ text: message }], timestamp: new Date() }, { role: 'model', parts: [{ text: aiResponseText }], timestamp: new Date() }] } } },
          { upsert: true }
        );
        res.send({ response: aiResponseText });
      } catch (error) {
        console.error("Error communicating with Gemini or saving chat:", error);
        res.status(500).send({ message: "Failed to get response from AI." });
      }
    });

    app.get('/chat/history', verifyToken, async (req, res) => {
      const userEmail = req.decoded.email;
      try {
        const conversation = await conversationsCollection.findOne({ userEmail });
        res.send(conversation ? conversation.messages : []);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).send({ message: "Failed to fetch chat history." });
      }
    });

    app.delete('/chat/history', verifyToken, async (req, res) => {
        const userEmail = req.decoded.email;
        try {
            const result = await conversationsCollection.updateOne(
                { userEmail },
                { $set: { messages: [] } }
            );
            res.send({ message: "Chat history cleared successfully.", modifiedCount: result.modifiedCount });
        } catch (error) {
            console.error("Error clearing chat history:", error);
            res.status(500).send({ message: "Failed to clear chat history." });
        }
    });

    // Root Endpoint
    app.get("/", (req, res) => {
      res.send("<h1>🤖 GeminiChat Server is Up and Running!</h1><p>Welcome to the API.</p>");
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('🔌 A user connected via WebSocket:', socket.id);
      socket.on('disconnect', () => {
        console.log('🚫 User disconnected:', socket.id);
      });
    });

    
    server.listen(port, () => {
      console.log(`🚀 Server with Socket.IO is live at http://localhost:${port}`);
    });

  } catch(err) {
    console.error("A critical error occurred while starting the server or database:", err);
  }
}


runDbAndServer();