// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set an initial welcome message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Store the conversation history as an array of messages
// Each message is an object: { role: "user" | "assistant" | "system", content: "..." }
const conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L'Oréal product questions. Answer in a friendly and informative way. Do not answer any questions unrelated to L'oréal products. No Swearing or inappropriate language. Keep your responses concise and relevant to the user's query in a friendly way that is inviting and helpful.",
  },
];

// This function sends the conversation history to the Cloudflare Worker and gets a response
async function getOpenAIResponse(message) {
  // Add the user's new message to the conversation history
  conversationHistory.push({ role: "user", content: message });

  // The endpoint for your Cloudflare Worker
  const endpoint = "https://loreal-worker.cannonb5.workers.dev/";

  // The data we send to the Worker, including the full conversation
  const data = {
    messages: conversationHistory,
  };

  try {
    // Make the API request to the Worker using fetch and async/await
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Parse the JSON response
    const result = await response.json();

    // Get the assistant's reply (the structure may differ depending on your Worker)
    // Try to access the reply in the most likely place
    let reply = "";
    if (
      result.choices &&
      result.choices[0] &&
      result.choices[0].message &&
      result.choices[0].message.content
    ) {
      reply = result.choices[0].message.content;
    } else if (result.message) {
      reply = result.message;
    } else {
      reply = "Sorry, I couldn't get a response from the assistant.";
    }

    // Add the assistant's reply to the conversation history
    conversationHistory.push({ role: "assistant", content: reply });

    // Return the assistant's reply
    return reply;
  } catch (error) {
    return "Sorry, I couldn't connect to the assistant. Please try again.";
  }
}

// Handle the chat form submission

// This function updates the chat window with the full conversation
function renderConversation() {
  // Start with an empty string
  let html = "";
  // Loop through the conversation history (skip the system message)
  for (let i = 1; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i];
    if (msg.role === "user") {
      html += `<div class="user-msg"><strong>You:</strong> ${msg.content}</div>`;
    } else if (msg.role === "assistant") {
      html += `<div class="bot-msg"><strong>Assistant:</strong> ${msg.content}</div>`;
    }
  }
  chatWindow.innerHTML = html;
  // Scroll to the bottom so the latest message is visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message
  const message = userInput.value;

  // Show the user's message and loading animation (but don't add user message to history here)
  renderConversation();
  chatWindow.innerHTML += `<div class="bot-msg"><span class="loading-dots"><span></span><span></span><span></span></span> Assistant is typing...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get the assistant's response from OpenAI (this will add both user and assistant messages to the history)
  await getOpenAIResponse(message);

  // Re-render the conversation with the new assistant reply
  renderConversation();

  // Clear the input box
  userInput.value = "";
});
