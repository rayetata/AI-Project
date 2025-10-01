const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ 1. Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ 2. Serve your main HTML file from "public"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "storyGenerator.html"));
});

// ✅ 3. Test route (optional)
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Gemini API Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ✅ 4. AI endpoint
app.post("/ai", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log(`Gemini response: ${responseText}`);
    res.json({ response: responseText });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({
      error: "Failed to get response from Gemini API.",
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
