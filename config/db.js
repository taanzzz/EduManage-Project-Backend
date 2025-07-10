const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let collections = {};

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db("EduManageDB");

    // --- Initialize all collections ---
    collections.usersCollection = db.collection("users");
    collections.classesCollection = db.collection("classes");
    collections.teacherRequestsCollection = db.collection("teacherRequests");
    collections.paymentsCollection = db.collection("payments");
    collections.assignmentsCollection = db.collection("assignments");
    collections.submissionsCollection = db.collection("submissions");
    collections.feedbackCollection = db.collection("feedback");
    collections.enrollmentsCollection = db.collection("enrollments");
    collections.bannersCollection = db.collection("banners"); 

    console.log("✅ MongoDB is successfully connected!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

const getCollections = () => collections;

// Updated getObjectId function to convert string to ObjectId instance
const getObjectId = (id) => new ObjectId(id);

module.exports = { connectDB, getDB, getCollections, getObjectId };
