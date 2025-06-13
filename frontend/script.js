const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");

function appendMessage(content, sender = "user") {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = `<p>${content}</p>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;

  appendMessage(text, "user");
  input.value = "";

  // Show typing message
  appendMessage("🤖 Typing...", "bot");

  try {
    console.log("Sending request to server...");
    
    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: text }
        ]
      })
    });

    console.log("Response status:", response.status);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data);

    // Remove typing message
    const botTyping = messages.querySelector(".message.bot:last-child");
    if (botTyping) botTyping.remove();

    // Check if response has the expected structure
    if (data.response) {
      appendMessage(data.response, "bot");
    } else {
      appendMessage("❌ Invalid response from server.", "bot");
    }

  } catch (error) {
    console.error("Detailed error:", error);
    const botTyping = messages.querySelector(".message.bot:last-child");
    if (botTyping) botTyping.remove();

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      appendMessage("❌ Cannot connect to server. Make sure it's running on http://127.0.0.1:8000", "bot");
    } else if (error.message.includes('HTTP error')) {
      appendMessage(`❌ Server error: ${error.message}`, "bot");
    } else {
      appendMessage(`❌ Error: ${error.message}`, "bot");
    }
  }
}

// Send button click
sendBtn.addEventListener("click", sendMessage);

// Pressing Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent form submission if inside a form
    sendMessage();
  }
});

// Test server connection when page loads
window.addEventListener('load', async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/");
    if (response.ok) {
      console.log("✅ Server connection successful");
    } else {
      console.log("⚠️ Server responded but with error");
    }
  } catch (error) {
    console.error("❌ Cannot connect to server:", error);
  }
});
