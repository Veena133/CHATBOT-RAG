import React, { useState } from "react";
import './App.css';

// Helper function to render bot messages as bullet/numbered lists if needed
function renderBotMessage(text) {
  const numberedListRegex = /(?:^|\s)(\d+\.)\s+/g;
  let numberedParts = text.split(numberedListRegex).filter(Boolean);

  if (numberedParts.length > 2) {
    let intro = numberedParts.shift().trim();
    let items = [];
    for (let i = 0; i < numberedParts.length; i += 2) {
      items.push((numberedParts[i] + " " + numberedParts[i + 1]).trim());
    }
    return (
      <div style={{ textAlign: "left", margin: "8px 0" }}>
        {intro && <div style={{ marginBottom: 4 }}>{intro}</div>}
        <ul>
          {items.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    );
  }

  let bulletRegex = /(?:^|\n|\r|\r\n)[*-]\s+|[*]\s+/g;
  let bullets = text.split(bulletRegex).map(s => s.trim()).filter(Boolean);
  if (bullets.length > 1) {
    let intro = "";
    if (!bullets[0].match(/^(Being|Meeting|Completing|Having|Must|Should|Applicants|Candidates|Students)/i)) {
      intro = bullets.shift();
    }
    return (
      <div style={{ textAlign: "left", margin: "8px 0" }}>
        {intro && <div style={{ marginBottom: 4 }}>{intro}</div>}
        <ul>
          {bullets.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    );
  }

  const lines = text.split('\n').filter(line => line.trim() !== "");
  const isNumberedList = lines.every(line => /^\d+\./.test(line.trim()));
  if (isNumberedList && lines.length > 1) {
    return (
      <ul style={{ textAlign: "left", margin: "8px 0" }}>
        {lines.map((line, idx) => (
          <li key={idx}>{line.replace(/^\d+\.\s*/, "")}</li>
        ))}
      </ul>
    );
  }

  return <span>{text}</span>;
}

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask me anything about college admissions." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => setQuestion(e.target.value);

  const handleSend = async () => {
    if (!question.trim()) return;
    setMessages([...messages, { sender: "user", text: question }]);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: data.answer || "Sorry, I couldn't find an answer." }
      ]);
    } catch (error) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error connecting to backend." }
      ]);
    }

    setLoading(false);
    setQuestion("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chat-container">
      <h2>College Admissions Chatbot</h2>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === "user" ? "user-msg" : "bot-msg"}>
            {msg.sender === "bot" && (
              <img
                src="https://img.icons8.com/ios-filled/50/bot.png"
                alt="bot"
                style={{ width: 30, height: 30, marginRight: 10 }}
              />
            )}
            {msg.sender === "user" && (
              <img
                src="https://img.icons8.com/ios-filled/50/user.png"
                alt="user"
                style={{ width: 30, height: 30, marginLeft: 10 }}
              />
            )}
            <div className={`bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}>
              {msg.sender === "bot" ? renderBotMessage(msg.text) : msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="bot-msg">
            <img
              src="https://img.icons8.com/ios-filled/50/bot.png"
              alt="bot"
              style={{ width: 30, height: 30, marginRight: 10 }}
            />
            <div className="bubble bot-bubble">
              <i>Bot is typing...</i>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", padding: "0 16px" }}>
        <input
          type="text"
          value={question}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
