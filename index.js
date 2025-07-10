const express = require("express");
const cors = require("cors");
const http = require('http');
require("dotenv").config();
const { connectDB } = require("./config/db");

// --- Route Imports ---
const authRoutes = require('./api/routes/auth.route');
const userRoutes = require('./api/routes/user.route');
const classRoutes = require('./api/routes/class.route');
const teacherRoutes = require('./api/routes/teacher.route');
const paymentRoutes = require('./api/routes/payment.route');
const publicRoutes = require('./api/routes/public.route');
const enrollmentRoutes = require('./api/routes/enrollment.route');
const assignmentRoutes = require('./api/routes/assignment.route');
const feedbackRoutes = require('./api/routes/feedback.route');
const submissionRoutes = require('./api/routes/submission.route');
 

// --- Initialization ---
const app = express();
const server = http.createServer(app);
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

// --- Database and Server Start ---
async function startServer() {
  try {
    await connectDB(); 

    // --- API Routes ---
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/classes', classRoutes);
    app.use('/api/teacher', teacherRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/public', publicRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/submissions', submissionRoutes);


    // --- Root Endpoint ---
    app.get("/", (req, res) => {
      res.send("<h1>EduManage Server is Up and Running! ✅</h1>");
    });

    server.listen(port, () => {
      console.log(`🚀 Server is live at http://localhost:${port}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();