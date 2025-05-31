require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

let db, collection;

// Kết nối MongoDB
MongoClient.connect(uri, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    collection = db.collection(collectionName);
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// POST /scores – Lưu điểm cuối cùng
app.post("/scores", async (req, res) => {
  const { name, score, coin } = req.body;
  if (!name || score === undefined || coin === undefined) {
    return res.status(400).json({ message: "Missing name, score, or coin" });
  }

  try {
    await collection.insertOne({ name, score, coin, createdAt: new Date() });
    res.status(201).json({ message: "Score saved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST /scores/temp – Lưu điểm tạm thời
app.post("/scores/temp", async (req, res) => {
  const { name, score, coin } = req.body;
  if (!name || score === undefined || coin === undefined) {
    return res.status(400).json({ message: "Missing name, score, or coin" });
  }

  try {
    // Cập nhật hoặc thêm điểm tạm thời (dựa trên tên)
    await collection.updateOne(
      { name, isTemp: true },
      { $set: { score, coin, createdAt: new Date(), isTemp: true } },
      { upsert: true }
    );
    res.status(200).json({ message: "Temporary score updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// GET /scores/top5 – Trả về top 5 người chơi (bao gồm cả điểm tạm thời)
app.get("/scores/top5", async (req, res) => {
  try {
    const topScores = await collection
      .find({})
      .sort({ score: -1 })
      .limit(5)
      .toArray();
    res.json(topScores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
