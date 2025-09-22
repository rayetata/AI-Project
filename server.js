const {GoogleGenAI} = require("@google/genai");
const express = require("express");
const app = express();
app.use(express.json());
const PORT = 3000;
const ai = new GoogleGenAI({
  apiKey: 'AIzaSyCkHPsXG8W9rMY3E2N8tJsQek97MaThMKc',
});

app.post('/ai', async (req, res) => {
    const {prompt} = req.body;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Here is the prompt -- ${prompt}`,
        config: {
            systemInstructions: 'You should act and respond like Elon Musk .',
            thinkingConfig: {
                thinkingBudget: 0,
            },
        },
    });
    console.log(`Gemini response: ${response}`);
    res.json({response: response.text});
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})