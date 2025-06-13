// script.js

// --- IMPORTANT: CONFIGURE YOUR API URL HERE ---
// Find this in your GitHub Codespaces "PORTS" tab. It will look like:
// https://your-codespace-name-random-chars-8000.app.github.dev
const API_BASE_URL = "https://sturdy-robot-wwpvr6jr4gxc5grg-8000.app.github.dev/"; 
// ---------------------------------------------

const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("message-input");
const messagesContainer = document.getElementById("chat-messages");
const emojiBtn = document.querySelector('button[title="Emoji"]');
const attachBtn = document.querySelector('button[title="Attach File"]');

// Store the conversation history in the format: { role: 'user'/'assistant', content: '...' }
let conversationHistory = [];

function appendMessage(content, sender = "user") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  // Use textContent for safety
  const p = document.createElement("p");
  p.textContent = content;
  messageDiv.appendChild(p);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;

  // 1. Display user message and add to history
  appendMessage(text, "user");
  conversationHistory.push({ role: "user", content: text });
  
  input.value = "";
  input.focus();

  // 2. Show typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message", "bot", "typing-indicator");
  typingIndicator.innerHTML = `<p>🤖 Typing...</p>`;
  messagesContainer.appendChild(typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    if (API_BASE_URL === "YOUR_CODESPACE_FORWARDED_URL") {
        throw new Error("API_BASE_URL is not configured in script.js. Please set it.");
    }
    
    // 3. Send the entire conversation history to the backend
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversationHistory 
      })
    });

    // 4. Remove typing indicator
    messagesContainer.removeChild(typingIndicator);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // 5. Display bot response and add to history
    if (data.response) {
      appendMessage(data.response, "bot");
      // IMPORTANT: Add bot's response to history with 'assistant' role
      conversationHistory.push({ role: "assistant", content: data.response });
    } else {
      appendMessage("❌ Invalid response structure from server.", "bot");
    }

  } catch (error) {
    console.error("Detailed error:", error);
    // Ensure typing indicator is removed on error
    const indicator = messagesContainer.querySelector(".typing-indicator");
    if (indicator) messagesContainer.removeChild(indicator);

    appendMessage(`❌ Error: ${error.message}`, "bot");
  }
}

// Event Listeners
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Placeholder for Emoji Button
emojiBtn.addEventListener("click", () => {
    alert("Emoji functionality is a future feature!");
});

// Placeholder for File Attachment Button
attachBtn.addEventListener("click", () => {
    alert("File attachment functionality is a future feature!");
});

// Initialize the chat
window.addEventListener('load', () => {
    const initialMessageElement = document.querySelector('.message.bot p');
    if (initialMessageElement) {
        const initialMessage = initialMessageElement.textContent;
        // Add the bot's welcome message to the conversation history
        conversationHistory.push({ role: 'assistant', content: initialMessage });
    }
    console.log("Gemini Chatbot initialized. Ready to chat!");
    input.focus();
});

