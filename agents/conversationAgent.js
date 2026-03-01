// agents/conversationAgent.js
// Orchestrates the conversation flow: applies safety checks, routes to actions, or
// queries the language model for responses.

const axios = require('axios');
const safetyAgent = require('./safetyAgent');
const actionAgent = require('./actionAgent');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function converse(message) {
    if (!message) {
        throw new Error('Message is required');
    }

    // run safety checks first
    if (!safetyAgent.checkMessage(message)) {
        return 'Your message did not pass our safety filters. Please rephrase.';
    }

    // simple intent detection example: string match
    const normalized = message.trim().toLowerCase();
    if (normalized.startsWith('add medicine')) {
        // expected format: "add medicine name=<name> stock=<n> prescriptionRequired=<true/false>"
        const parts = message.split(' ').slice(2); // skip "add" "medicine"
        const payload = {};
        parts.forEach(part => {
            const [k, v] = part.split('=');
            if (k && v !== undefined) payload[k] = v;
        });
        try {
            const result = await actionAgent.perform('addMedicine', payload);
            return `Medicine added successfully: ${JSON.stringify(result)}`;
        } catch (err) {
            return `Failed to perform action: ${err.message}`;
        }
    }

    // default: forward to AI model for conversational response
    if (!GEMINI_API_KEY) {
        return 'AI is not configured on the server.';
    }

    const prompt = `You are a helpful medical assistant chatbot. Only answer questions related to medicine suggestions, general health tips, and medication information. If the question is not related to medicine or health, politely decline to answer and suggest asking about medicine-related topics.

User question: ${message}

Provide a helpful, accurate, and concise response. If you're not sure about specific medical advice, always recommend consulting with a healthcare professional.`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        contents: [{
            parts: [{
                text: prompt,
            }],
        }],
    });

    return response.data.candidates[0].content.parts[0].text;
}

module.exports = { converse };
