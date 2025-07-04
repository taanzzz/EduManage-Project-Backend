require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require('http');
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");


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

// --- Socket.IO Initialization (অপরিবর্তিত) ---
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
    // --- এই ভ্যারিয়েবলগুলো সব রুটের মধ্যে ব্যবহৃত হবে ---
    const usersCollection = db.collection("users");
    const conversationsCollection = db.collection("conversations");
    
    console.log("✅ MongoDB for Chatbot is successfully connected!");

    // --------------------------- API ENDPOINTS ---------------------------
    
    // verifyToken Middleware (অপরিবর্তিত)
    const verifyToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ message: "Unauthorized access" });
        }
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(403).send({ message: "Forbidden access" });
            req.decoded = decoded;
            next();
        });
    };

    app.get("/", (req, res) => {
      res.send("<h1>🤖 GeminiChat Server is Up and Running!</h1>");
    });

    app.post("/jwt", async (req, res) => {
      // এখানে usersCollection সরাসরি ব্যবহার করা হচ্ছে
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
        res.status(500).send({ message: "Server error during authentication." });
      }
    });

    // --- নতুন API: সমস্ত চ্যাটের তালিকা ---
    app.get('/conversations', verifyToken, async (req, res) => {
        const userEmail = req.decoded.email;
        const conversations = await conversationsCollection
            .find({ userEmail })
            .project({ title: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(conversations);
    });

    // --- নতুন API: একটি নির্দিষ্ট চ্যাটের মেসেজ ---
    app.get('/conversations/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const userEmail = req.decoded.email;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID." });

        const conversation = await conversationsCollection.findOne({ _id: new ObjectId(id), userEmail });
        if (!conversation) return res.status(404).send({ message: "Not found." });
        
        res.send(conversation.messages);
    });

    // --- আপডেটেড API: মেসেজ পাঠানো ---
    app.post('/chat/send-message', verifyToken, async (req, res) => {
      try {
          let { conversationId, history, message } = req.body;
          const userEmail = req.decoded.email;
          
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(message);
          const aiResponseText = result.response.text();

          let updatedConversationId = conversationId;

          if (!conversationId) {
              const titlePrompt = `Summarize this message in 3-5 words to use as a title: "${message}"`;
              const titleResult = await model.generateContent(titlePrompt);
              const title = titleResult.response.text().replace(/"/g, '').trim();

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
              await conversationsCollection.updateOne(
                  { _id: new ObjectId(conversationId), userEmail },
                  { $push: { messages: { $each: [
                      { role: 'user', parts: [{ text: message }], timestamp: new Date() },
                      { role: 'model', parts: [{ text: aiResponseText }], timestamp: new Date() }
                  ]}}}
              );
          }
          res.send({ response: aiResponseText, conversationId: updatedConversationId });
      } catch (error) {
          console.error("Error sending message:", error);
          res.status(500).send({ message: "Failed to get response from AI." });
      }
    });
    
    // --- নতুন API: চ্যাট ডিলিট করা ---
    app.delete('/conversations/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const userEmail = req.decoded.email;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID." });

        const result = await conversationsCollection.deleteOne({ _id: new ObjectId(id), userEmail });
        if (result.deletedCount === 0) return res.status(404).send({ message: "Not found." });

        res.send({ message: "Conversation deleted." });
    });

    // --- সার্ভার চালু করা ---
    server.listen(port, () => {
      console.log(`🚀 Server with Socket.IO is live at http://localhost:${port}`);
    });

  } catch(err) {
    console.error("A critical error occurred while starting the server or database:", err);
  }
}

// মূল ফাংশনটি কল করুন
runDbAndServer();