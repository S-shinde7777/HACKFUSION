const express = require('express');
const axios = require('axios');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// POST /api/chat - AI Chatbot for medicine suggestions
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        // Prepare prompt for medicine-related queries only
        const prompt = `You are a helpful medical assistant chatbot. Only answer questions related to medicine suggestions, general health tips, and medication information. If the question is not related to medicine or health, politely decline to answer and suggest asking about medicine-related topics.

User question: ${message}

Provide a helpful, accurate, and concise response. If you're not sure about specific medical advice, always recommend consulting with a healthcare professional.`;

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        res.json({ response: aiResponse });
        
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        
        // Provide a fallback response
        res.json({ 
            response: "I'm here to help with medicine-related questions. Please ask about medications, dosages, or general health tips. For specific medical advice, always consult with a healthcare professional."
        });
    }
});

module.exports = router;