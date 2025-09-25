import { useState, useRef, useEffect } from "react";
import { MdSend } from "react-icons/md";
import { webApi } from "./api/api";
import Leads from "./leads";

import Gpt from "./assets/openai.png"; // Adjust the path as necessary
import DeepSeekIcon from "./assets/deepseek-color.png"; // Adjust the path as necessary
import { Book } from "lucide-react";

function ChatBot() {
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentModel, setCurrentModel] = useState('chatgpt');

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);


  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);
useEffect(() => {
  const startConversation = async () => {
    try {
      const res = await fetch(`${webApi}/clinicchat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "Career_coach",
          page_id: "612142091972168",
          message: "", // Empty message to trigger welcome
          model: currentModel
        }),
      });

      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      
      // Only update if we actually got a reply
      if (data.reply && data.reply.trim()) {
        setChatHistory([{ sender: "bot", text: data.reply }]);
      } else {
        // Fallback welcome message
        setChatHistory([{ 
          sender: "bot", 
          text: "Hello! I'm Coach Jade, and I'll be guiding you through this career exploration session. To start, can you tell me a bit about your educational background and past work experience?" 
        }]);
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
      // Fallback welcome message on error
      setChatHistory([{ 
        sender: "bot", 
        text: "Hello! I'm Coach Jade, and I'll be guiding you through this career exploration session. To start, can you tell me a bit about your educational background and past work experience?" 
      }]);
    }
  };


  if (chatHistory.length === 0) {
    startConversation();
  }
}, []); 

const sendMessage = async () => {
  if (!userMessage.trim()) return;

  const message = userMessage;
  setUserMessage("");
  setIsTyping(true);

  setChatHistory((prev) => [...prev, { sender: "user", text: message }]);

  try {
    const res = await fetch(`${webApi}/clinicchat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": "OPENAI_API" 
      },
      body: JSON.stringify({
        user_id: "Career_coach",
        page_id: "612142091972168",
        message: message,
        model: currentModel,
        modelConfig: {
          temperature: 0.7,
          maxTokens: currentModel === 'chatgpt' ? 2048 : 4096
        }
      }),
    });

    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();

    // Add bot reply
    setChatHistory((prev) => [...prev, { sender: "bot", text: data.reply }]);
  } catch (err) {
    console.error(err);
    setChatHistory((prev) => [
      ...prev,
      { sender: "bot", text: `Error: ${err.message}` },
    ]);
  } finally {
    setIsTyping(false);
    inputRef.current?.focus();
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen w-full bg-black p-0 m-0 flex items-center justify-center">

<button
  onClick={() => window.open('/leads', '_blank')}
  className="fixed z-10 left-5 top-5 cursor-pointer bg-indigo-900 hover:bg-indigo-800 text-white p-4 rounded-lg transition-all duration-300"
>
 <Book />
</button>


      <div className="w-full max-w-4xl h-screen md:h-[90vh] bg-[#0a0a0a] flex flex-col rounded-none md:rounded-2xl shadow-2xl overflow-hidden border-0 md:border border-gray-900">
        {/* Header */}
        <div className="darkbg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-400 mr-2 animate-pulse"></div>
            <h1 className="text-white font-bold text-xl">Career Coach AI</h1>
          </div>
          <div className="flex items-center gap-4">
    

<div className="flex items-center gap-4">
  {/* Toggle Switch */}
  <div className="relative inline-block w-12 h-6">
    <input
      type="checkbox"
      id="modelToggle"
      className="sr-only peer"
      onChange={(e) =>
        setCurrentModel(e.target.checked ? "deepseek" : "chatgpt")
      }
      checked={currentModel === "deepseek"}
    />
    <label
      htmlFor="modelToggle"
      className="absolute inset-0 cursor-pointer rounded-full bg-gray-700 peer-checked:bg-indigo-600 before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:inset-y-1 before:left-1 peer-checked:before:translate-x-6 before:transition-all before:duration-300"
    >
      <span className="sr-only">Toggle AI Model</span>
    </label>
  </div>

  {/* Model Icons */}
<div className="flex items-center gap-4">
  {/* GPT Icon */}
  <img
    src={Gpt}  // path to your GPT PNG
    alt="GPT"
    className={`w-6 h-6 transition-all duration-300 ${
      currentModel === "chatgpt"
        ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
        : "opacity-10"
    }`}
  />

  {/* DeepSeek Icon */}
  <img
    src={DeepSeekIcon} // path to your DeepSeek PNG
    alt="DeepSeek"
    className={`w-6 h-6 transition-all duration-300 ${
      currentModel === "deepseek"
        ? " drop-shadow-[0_0_12px_rgba(0,191,255,0.8)]"
        : "opacity-10"
    }`}
  />
</div>
</div>

            <div className="text-xs text-gray-300 flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-400 mr-1"></div>
              Online
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #1a1a1a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundColor: '#050505'
          }}
        >
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } animate-fade-in`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-indigo-900 text-start text-white rounded-l-2xl rounded-tr-2xl ml-4"
                    : "bg-[#1a1a1a] text-start text-gray-100 rounded-r-2xl rounded-tl-2xl mr-4"
                } p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl border border-gray-800`}
              >
                <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                <div className={`text-xs mt-1 ${msg.sender === "user" ? "text-indigo-300" : "text-gray-500"}`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] text-gray-100 rounded-r-2xl rounded-tl-2xl p-4 shadow-lg mr-4 border border-gray-800">
                <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-.5s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black border-t border-gray-900">
          <div className="flex gap-2 items-center bg-[#0a0a0a] rounded-xl p-2 shadow-inner border border-gray-900">
            <input
              ref={inputRef}
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-grow p-3 bg-transparent text-white placeholder-gray-600 focus:outline-none"
              autoComplete="off"
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !userMessage.trim()}
              className={`p-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg transition-all ${
                isTyping || !userMessage.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg transform hover:scale-105"
              }`}
            >
              <MdSend className="text-xl" />
            </button>
          </div>
          <div className="text-xs text-gray-700 mt-2 text-center">
            Press Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatBot;
