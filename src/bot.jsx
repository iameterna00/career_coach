import { useState, useRef, useEffect } from "react";
import { MdSend } from "react-icons/md";
import { webApi } from "./api/api";
import { Book } from "lucide-react";
import ReactMarkdown from "react-markdown";

import Gpt from "./assets/openai.png";
import DeepSeekIcon from "./assets/deepseek-color.png";

function ChatBot() {
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentModel, setCurrentModel] = useState("chatgpt");
  const [chatClosed, setChatClosed] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const eventSourceRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (inputRef.current && userMessage === "") {
      inputRef.current.style.height = "35px";
    }
  }, [userMessage]);

  // Fetch conversation history on component mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeChat = async () => {
      try {
        const historyResponse = await fetch(
          `${webApi}/conversation-history?user_id=Career_coach&page_id=612142091972168`
        );
        const historyData = await historyResponse.json();
        
        // BACKEND TELLS FRONTEND IF CHAT IS CLOSED
        if (historyData.chat_closed) {
          setChatClosed(true);
        }
        
        if (historyData.messages && historyData.messages.length > 0) {
          const formattedHistory = historyData.messages.map((msg, index) => ({
            id: Date.now() + index,
            sender: msg.role === "user" ? "user" : "assistant",
            text: msg.content,
            time: new Date(),
            isStreaming: false
          }));
          setChatHistory(formattedHistory);
        } else {
          await triggerAIGreeting();
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        await triggerAIGreeting();
      } finally {
        setHistoryLoaded(true);
      }
    };

    initializeChat();
  }, []);

  const triggerAIGreeting = async () => {
    setIsTyping(true);
    const messageId = Date.now();

    setChatHistory([
      { id: messageId, sender: "assistant", text: "", isStreaming: true, time: null }
    ]);

    eventSourceRef.current = new EventSource(
      `${webApi}/careerbot-stream?user_id=Career_coach&page_id=612142091972168&message=&model=${currentModel}`
    );

    eventSourceRef.current.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSourceRef.current.close();
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, isStreaming: false, time: new Date() }
              : msg
          )
        );
        setIsTyping(false);
        return;
      }

      try {
        const data = JSON.parse(event.data);

        // BACKEND TELLS FRONTEND TO CLOSE CHAT
        if (data.close_chat) {
          setChatClosed(true);
          setIsTyping(false);
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { 
                    ...msg, 
                    text: data.content || data.message || "", 
                    isStreaming: false, 
                    time: new Date() 
                  }
                : msg
            )
          );
          eventSourceRef.current.close();
          return;
        }

        if (data.content) {
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { ...msg, text: msg.text + data.content }
                : msg
            )
          );
        }
      } catch (err) {
        console.error("Error parsing greeting SSE:", err);
      }
    };

    eventSourceRef.current.onerror = (err) => {
      console.error("Greeting SSE error:", err);
      eventSourceRef.current.close();
      setChatHistory(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, text: "Hello! How can I help with your career today?", isStreaming: false, time: new Date() }
            : msg
        )
      );
      setIsTyping(false);
    };
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || chatClosed) return; 

    const message = userMessage;
    setUserMessage("");
    setIsTyping(true);

    const userMessageId = Date.now();
    const assistantMessageId = userMessageId + 1;

    setChatHistory(prev => [
      ...prev,
      { id: userMessageId, sender: "user", text: message, time: new Date() },
      { id: assistantMessageId, sender: "assistant", text: "", isStreaming: true, time: null }
    ]);

    try {
      eventSourceRef.current = new EventSource(
        `${webApi}/careerbot-stream?user_id=Career_coach&page_id=612142091972168&message=${encodeURIComponent(
          message
        )}&model=${currentModel}`
      );

      eventSourceRef.current.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSourceRef.current.close();
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false, time: new Date() }
                : msg
            )
          );
          setIsTyping(false);
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // BACKEND TELLS FRONTEND TO CLOSE CHAT
          if (data.close_chat) {
            setChatClosed(true);
            setIsTyping(false);
            
            setChatHistory(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      text: data.content || data.message || "", 
                      isStreaming: false, 
                      time: new Date() 
                    }
                  : msg
              )
            );
            
            eventSourceRef.current.close();
            return;
          }

          // Handle normal content streaming
          if (data.content) {
            setChatHistory(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, text: msg.text + data.content }
                  : msg
              )
            );
          }

        } catch (err) {
          console.error("Error parsing SSE data:", err);
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, text: "Error processing response", isStreaming: false, time: new Date() }
                : msg
            )
          );
          setIsTyping(false);
          eventSourceRef.current.close();
        }
      };

      eventSourceRef.current.onerror = (err) => {
        console.error("Streaming error:", err);
        eventSourceRef.current.close();
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, text: "⚠️ Error streaming response", isStreaming: false, time: new Date() }
              : msg
          )
        );
        setIsTyping(false);
      };
    } catch (err) {
      console.error(err);
      setChatHistory(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, text: `Error: ${err.message}`, isStreaming: false, time: new Date() }
            : msg
        )
      );
      setIsTyping(false);
    }
  };

  // Rest of your code remains the same...
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModelChange = (model) => {
    setCurrentModel(model);
  };

  function fixSpacing(text) {
    if (!text) return "";
    let fixed = text.replace(/\\n/g, "\n");
    fixed = fixed
      .replace(/([.!?])([A-Za-z])/g, "$1 $2")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/  +/g, " ")
      .replace(/([a-zA-Z])(\d)/g, "$1 $2")
      .replace(/(\*\*[^*]+\*\*)([A-Za-z0-9])/g, "$1 $2")
      .replace(/\*\*\s*(.*?)\s*\*\*/g, "**$1**")
      .trim();
    return fixed;
  }

  const StreamingText = ({ text, isStreaming }) => {
    return (
      <div className="inline break-words align-middle">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <span className="mb-2" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-semibold text-white/95" {...props} />,
            em: ({ node, ...props }) => <em className="italic text-white/90" {...props} />,
            code: ({ node, ...props }) => <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1" {...props} />,
            li: ({ node, ...props }) => <li className="pl-2" {...props} />
          }}
        >
          {fixSpacing(text)}
        </ReactMarkdown>

        {isStreaming && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400/80 ml-1 align-middle animate-pulse"></span>
        )}
      </div>
    );
  };

  // Show loading state while history is being fetched
  if (!historyLoaded) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white/60">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-0 md:p-4">
      {/* Leads Button */}
      <button
        onClick={() => window.open("/leads", "_blank")}
        className="fixed z-10 left-5 top-5 cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white p-3 rounded-xl border border-white/10 transition-all duration-300 hover:scale-105"
      >
        <Book size={20} />
      </button>

      {/* Main Chat Container */}
      <div className="w-full max-w-4xl h-screen md:h-[95vh] flex flex-col rounded-[1px] md:rounded-2xl overflow-hidden border border-white/10
                bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a2e]
                backdrop-blur-2xl">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
            <h1 className="text-white/95 font-light text-xl tracking-wide">Career Coach</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/10">
              <button
                onClick={() => handleModelChange("chatgpt")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentModel === "chatgpt" 
                    ? "bg-white/10 shadow-lg" 
                    : "opacity-50 hover:opacity-70"
                }`}
              >
                <img src={Gpt} alt="GPT" className="w-5 h-5" />
                <span className="text-white/80 text-sm font-light">GPT</span>
              </button>
              <button
                onClick={() => handleModelChange("deepseek")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentModel === "deepseek" 
                    ? "bg-white/10 shadow-lg" 
                    : "opacity-50 hover:opacity-70"
                }`}
              >
                <img src={DeepSeekIcon} alt="DeepSeek" className="w-5 h-5" />
                <span className="text-white/80 text-sm font-light">DeepSeek</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide overfolw-x-hidden p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {chatHistory.map((msg, index) => {
            const isLastMessage = index === chatHistory.length - 1;
            return (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl relative backdrop-blur-xl border ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-500/30 text-white/95 rounded-br-md"
                    : "bg-white/5 border-white/10 text-white/80 rounded-bl-md"
                } shadow-2xl`}>
                  <StreamingText text={msg.text} isStreaming={msg.isStreaming && isLastMessage && msg.sender !== "user"} />
                  {msg.time && (
                    <span className="absolute -bottom-6 right-0 text-xs text-white/40 font-light">
                      {msg.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black/20 backdrop-blur-xl border-t border-white/10">
          <div className="flex gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 transition-all duration-300 focus-within:border-white/20">
            <div className="flex flex-grow items-center">
              <textarea
                ref={inputRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatClosed ? "The assistant has closed this chat." : "Ask anything about your career..."}
                className={`w-full bg-transparent text-white/95 scrollbar-hide placeholder-white/40 focus:outline-none font-light text-md resize-none overflow-auto ${chatClosed ? "text-center" : ""}`}
                autoComplete="off"
                disabled={isTyping || chatClosed}
                style={{ minHeight: "35px", maxHeight: "200px", lineHeight: "1.2rem", paddingTop:'8px' }}
                onInput={(e) => {
                  e.target.style.height = "auto"; 
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"; 
                }}
              />
            </div>

            {!chatClosed && (
              <div className="flex items-end">
                <button
                  onClick={sendMessage}
                  disabled={isTyping || !userMessage.trim()}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isTyping || !userMessage.trim()
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white hover:from-blue-500 hover:to-purple-600 hover:scale-105"
                  }`}
                >
                  <MdSend className="text-xl" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;