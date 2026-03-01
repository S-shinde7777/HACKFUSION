const express = require('express');
const axios = require('axios');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// POST /api/chat - AI Chatbot for medicine suggestions
// This route delegates to the conversation agent which applies safety checks,
// handles simple commands, and falls back to the language model when needed.
const conversationAgent = require('../agents/conversationAgent');

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const reply = await conversationAgent.converse(message);
        res.json({ response: reply });
    } catch (error) {
        console.error('Conversation error:', error.message || error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

module.exports = router;