// API Configuration
const API_URL = '/ai';
const TEST_URL = '/test';
// Application State
let storyHistory = [];
let isConnected = false;

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const continueBtn = document.getElementById('continue-btn');
const rewriteBtn = document.getElementById('rewrite-btn');
const createCharacterBtn = document.getElementById('create-character-btn');
const testBtn = document.getElementById('test-btn');
const storyContent = document.getElementById('story-content');
const typingIndicator = document.getElementById('typing-indicator');
const connectionStatus = document.getElementById('connection-status');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    generateBtn.addEventListener('click', generateStoryBeginning);
    continueBtn.addEventListener('click', continueStory);
    rewriteBtn.addEventListener('click', rewriteLastPart);
    createCharacterBtn.addEventListener('click', createCharacter);
    testBtn.addEventListener('click', testConnection);
    
    // Test connection on startup
    testConnection();
});

// Test server connection
async function testConnection() {
    try {
        connectionStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> Testing connection...';
        connectionStatus.className = 'connection-status';
        
        const response = await fetch(TEST_URL);
        
        if (response.ok) {
            const data = await response.json();
            connectionStatus.innerHTML = `<i class="fas fa-check-circle"></i> Connected to server: ${data.message}`;
            connectionStatus.className = 'connection-status status-connected';
            isConnected = true;
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        connectionStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> Server connection failed: ${error.message}`;
        connectionStatus.className = 'connection-status status-disconnected';
        isConnected = false;
        
        addMessage('System', `Cannot connect to server. Make sure your server is running on port 3000. Error: ${error.message}`, false, true);
    }
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.classList.add('show');
    storyContent.scrollTop = storyContent.scrollHeight;
    setButtonsDisabled(true);
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
    setButtonsDisabled(false);
}

// Enable/disable buttons during API calls
function setButtonsDisabled(disabled) {
    generateBtn.disabled = disabled;
    continueBtn.disabled = disabled;
    rewriteBtn.disabled = disabled;
    createCharacterBtn.disabled = disabled;
    testBtn.disabled = disabled;
}

// Add a message to the story content
function addMessage(sender, text, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    
    if (isError) {
        messageDiv.className = 'message error-message';
    } else {
        messageDiv.className = isUser ? 'message user-message' : 'message ai-message';
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span>${sender}</span>
            <span>${timeString}</span>
        </div>
        <p>${text}</p>
    `;
    
    storyContent.appendChild(messageDiv);
    storyContent.scrollTop = storyContent.scrollHeight;
    
    // Store in history (unless it's an error message)
    if (!isError) {
        storyHistory.push({
            sender,
            text,
            isUser,
            timestamp: now
        });
    }
}

// Call the Gemini API
async function callGeminiAPI(prompt) {
    if (!isConnected) {
        throw new Error('Not connected to server. Please test the connection first.');
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

// Build a context-aware prompt
function buildPrompt(action, userInput, context = '') {
    const genre = document.getElementById('genre').value;
    const tone = document.getElementById('tone').value;
    
    let prompt = '';
    
    switch(action) {
        case 'generate':
            prompt = `As a creative writing assistant, start a ${genre} story with a ${tone} tone based on this idea: "${userInput}". Write an engaging beginning that sets up the scene and characters.`;
            break;
            
        case 'continue':
            prompt = `Continue this ${genre} story with a ${tone} tone. Here's the story so far: "${context}". Continue the narrative naturally, developing the plot and characters.`;
            break;
            
        case 'rewrite':
            prompt = `Rewrite the last part of this ${genre} story with a ${tone} tone to make it more engaging. The story so far: "${context}". Focus on improving the most recent section while maintaining consistency.`;
            break;
            
        case 'character':
            prompt = `Create a detailed character for a ${genre} story with a ${tone} tone. The character should be a: "${userInput}". Provide a name, key personality traits, motivations, and a flaw. Format it clearly.`;
            break;
    }
    
    return prompt;
}

// Get the recent story context
function getStoryContext() {
    if (storyHistory.length === 0) return '';
    
    // Get the last few AI messages for context
    const recentMessages = storyHistory
        .filter(msg => !msg.isUser)
        .slice(-3)
        .map(msg => msg.text)
        .join(' ');
        
    return recentMessages.substring(0, 1000); // Limit context length
}

// Generate story beginning
async function generateStoryBeginning() {
    const userPrompt = document.getElementById('prompt').value;
    
    if (!userPrompt.trim()) {
        alert('Please enter a story idea to get started!');
        return;
    }
    
    showTypingIndicator();
    addMessage('You', userPrompt, true);
    
    try {
        const fullPrompt = buildPrompt('generate', userPrompt);
        const aiResponse = await callGeminiAPI(fullPrompt);
        addMessage('StoryCraft AI', aiResponse);
    } catch (error) {
        addMessage('System', `Error: ${error.message}`, false, true);
    }
    
    hideTypingIndicator();
}

// Continue the story
async function continueStory() {
    if (storyHistory.length === 0) {
        alert('Please generate a story beginning first!');
        return;
    }
    
    showTypingIndicator();
    addMessage('You', '[Continue the story]', true);
    
    try {
        const context = getStoryContext();
        const fullPrompt = buildPrompt('continue', '', context);
        const aiResponse = await callGeminiAPI(fullPrompt);
        addMessage('StoryCraft AI', aiResponse);
    } catch (error) {
        addMessage('System', `Error: ${error.message}`, false, true);
    }
    
    hideTypingIndicator();
}

// Rewrite the last part
async function rewriteLastPart() {
    if (storyHistory.length === 0) {
        alert('There\'s nothing to rewrite yet!');
        return;
    }
    
    showTypingIndicator();
    addMessage('You', '[Rewrite the last part]', true);
    
    try {
        const context = getStoryContext();
        const fullPrompt = buildPrompt('rewrite', '', context);
        const aiResponse = await callGeminiAPI(fullPrompt);
        addMessage('StoryCraft AI', `(Rewritten) ${aiResponse}`);
    } catch (error) {
        addMessage('System', `Error: ${error.message}`, false, true);
    }
    
    hideTypingIndicator();
}

// Create a character
async function createCharacter() {
    const roleInput = document.getElementById('character-role').value.trim();
    
    if (!roleInput) {
        alert('Please enter a character role (e.g., brave knight, cunning thief)');
        return;
    }
    
    showTypingIndicator();
    addMessage('You', `Create a character: ${roleInput}`, true);
    
    try {
        const fullPrompt = buildPrompt('character', roleInput);
        const aiResponse = await callGeminiAPI(fullPrompt);
        addMessage('Novelify', `Character created:\n${aiResponse}`);
    } catch (error) {
        addMessage('System', `Error: ${error.message}`, false, true);
    }
    
    hideTypingIndicator();
}
