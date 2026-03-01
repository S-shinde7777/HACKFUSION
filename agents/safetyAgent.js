// agents/safetyAgent.js
// Simple safety filter to reject unsafe inputs before processing

function checkMessage(text) {
    if (!text) return false;
    const lowered = text.toLowerCase();

    // Basic list of disallowed words or phrases
    const bannedList = [
        'abuse',
        'hate',
        'kill',
        // add more as needed
    ];

    for (const term of bannedList) {
        if (lowered.includes(term)) {
            return false;
        }
    }

    return true;
}

module.exports = {
    checkMessage,
};
