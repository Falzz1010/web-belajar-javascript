const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Pastikan API key tersedia
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in .env file');
    process.exit(1);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// CORS configuration - update origins
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false,
                error: 'Message content is required' 
            });
        }

        // Generate response using Gemini
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        console.log('AI Response:', text); // Debug log

        res.json({ 
            success: true, 
            response: text 
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});