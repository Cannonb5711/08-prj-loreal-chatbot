// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Store the conversation history as an array of messages
// Each message is an object: { role: "user" | "assistant" | "system", content: "..." }
const conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L'Oréal product questions. Answer in a friendly and informative way. Do not answer any questions unrelated to L'oréal products. No Swearing or inappropriate language. Keep your responses concise and relevant to the user's query in a friendly way that is inviting and helpful.",
  },
  {
    role: "assistant",
    content: "Welcome to the L'Oréal Chatbot! How can I help you today?",
  },
];

// This function sends the conversation history to the Cloudflare Worker and gets a response
async function getOpenAIResponse(message) {
  // Do NOT add the user's message here; it is already added in the submit handler

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
      html += `<div class="bot-msg">${msg.content}</div>`;
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

  // Add the user's message to the conversation history and show it immediately
  conversationHistory.push({ role: "user", content: message });
  renderConversation();

  // Show a loading animation for the assistant
  chatWindow.innerHTML += `<div class="bot-msg"><span class="loading-dots"><span></span><span></span><span></span></span> Assistant is typing...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get the assistant's response from OpenAI (this will add the assistant message to the history)
  await getOpenAIResponse(message);

  // Re-render the conversation with the new assistant reply
  renderConversation();

  // Clear the input box
  userInput.value = "";
});
