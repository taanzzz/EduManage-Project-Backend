const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require('http');
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    try {
        const db = await connectToDatabase();
        const conversationsCollection = db.collection("conversations");
        // conversationId এখন ফ্রন্টএন্ড থেকে আসবে
        let { conversationId, history, message } = req.body;
        const userEmail = req.decoded.email;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // জেমিনি থেকে উত্তর নিন
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const aiResponseText = result.response.text();

        let updatedConversationId = conversationId;

        // যদি conversationId না থাকে, তার মানে এটি একটি নতুন চ্যাট
        if (!conversationId) {
            // চ্যাটের প্রথম মেসেজ থেকে একটি শিরোনাম তৈরি করুন
            const titlePrompt = `Summarize this message in 3-5 words to use as a title: "${message}"`;
            const titleResult = await model.generateContent(titlePrompt);
            const title = titleResult.response.text().replace(/"/g, '').trim();

            // ডাটাবেজে নতুন ডকুমেন্ট তৈরি করুন
            const newConversation = await conversationsCollection.insertOne({
                userEmail,
                title,
                messages: [
                    { role: 'user', parts: [{ text: message }], timestamp: new Date() },
                    { role: 'model', parts: [{ text: aiResponseText }], timestamp: new Date() }
                ],
                createdAt: new Date()
            });
            updatedConversationId = newConversation.insertedId;
        } else {
            // যদি পুরনো চ্যাট হয়, তাহলে শুধু মেসেজ যোগ করুন
            await conversationsCollection.updateOne(
                { _id: new ObjectId(conversationId), userEmail },
                { $push: { messages: { $each: [
                    { role: 'user', parts: [{ text: message }], timestamp: new Date() },
                    { role: 'model', parts: [{ text: aiResponseText }], timestamp: new Date() }
                ]}}}
            );
        }
        
        // ফ্রন্টএন্ডকে নতুন conversationId (যদি তৈরি হয়) এবং উত্তর পাঠান
        res.send({ response: aiResponseText, conversationId: updatedConversationId });

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send({ message: "Failed to get response from AI." });
    }
});

    app.get('/conversations/:id', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const conversationsCollection = db.collection("conversations");
        const { id } = req.params;
        const userEmail = req.decoded.email;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid conversation ID." });
        }

        const conversation = await conversationsCollection.findOne({ 
            _id: new ObjectId(id), 
            userEmail // নিশ্চিত করুন যে ইউজার শুধুমাত্র নিজের চ্যাটই দেখতে পারে
        });

        if (!conversation) {
            return res.status(404).send({ message: "Conversation not found." });
        }
        
        res.send(conversation.messages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        res.status(500).send({ message: "Failed to fetch messages." });
    }
});

app.delete('/conversations/:id', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const conversationsCollection = db.collection("conversations");
        const { id } = req.params;
        const userEmail = req.decoded.email;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid conversation ID." });
        }

        const result = await conversationsCollection.deleteOne({ _id: new ObjectId(id), userEmail });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Conversation not found or you don't have permission to delete it." });
        }

        res.send({ message: "Conversation deleted successfully." });
    } catch (error) {
        console.error("Failed to delete conversation:", error);
        res.status(500).send({ message: "Failed to delete conversation." });
    }
});

    app.get('/conversations', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const conversationsCollection = db.collection("conversations");
        const userEmail = req.decoded.email;
        
        const conversations = await conversationsCollection
            .find({ userEmail })
            .project({ title: 1, createdAt: 1 }) // শুধুমাত্র শিরোনাম এবং তৈরির তারিখ পাঠান
            .sort({ createdAt: -1 })
            .toArray();
            
        res.send(conversations);
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        res.status(500).send({ message: "Failed to fetch conversations." });
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