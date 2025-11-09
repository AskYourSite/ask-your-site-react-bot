import React, { useState, useEffect, useRef } from 'react';
import { AskMySiteProps, ChatbotConfig, Message } from './types';
import { AskMySiteService } from './service';
import './styles.css';

export const AskMySite: React.FC<AskMySiteProps> = ({
  apiKey,
  position = 'bottom-right',
  primaryColor,
  apiBaseUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<AskMySiteService | null>(null);

  // ============================================================================
  // INITIALIZATION - Load config and stored messages
  // ============================================================================
  useEffect(() => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    serviceRef.current = new AskMySiteService(apiKey, apiBaseUrl);

    const initWidget = async () => {
      try {
        // Fetch config (from cache or API)
        const fetchedConfig = await serviceRef.current!.fetchConfig();
        setConfig(fetchedConfig);

        // Load stored messages from localStorage
        const storedMessages = serviceRef.current!.getStoredMessages();
        
        if (storedMessages.length > 0) {
          // User has chat history - restore it
          setMessages(storedMessages);
        } else {
          // New user - show welcome message
          const welcomeMessage: Message = {
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            content: fetchedConfig.welcomeMessage,
            createdAt: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
          serviceRef.current!.saveMessages([welcomeMessage]);
        }
      } catch (err) {
        setError('Failed to load chatbot configuration');
        console.error(err);
      }
    };

    initWidget();
  }, [apiKey, apiBaseUrl]);

  // ============================================================================
  // AUTO-SCROLL to latest message
  // ============================================================================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ============================================================================
  // SEND MESSAGE - Auto-creates session, persists to localStorage
  // ============================================================================
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !serviceRef.current || loading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputValue.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add user message to UI and storage
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    serviceRef.current.saveMessages(updatedMessages);
    
    setInputValue('');
    setLoading(true);

    try {
      // Send to API (auto-creates session if needed via X-Session-Token header)
      const response = await serviceRef.current.sendMessage({
        message: userMessage.content,
      });

      // Add assistant message to UI and storage
      const messagesWithResponse = [...updatedMessages, response.message];
      setMessages(messagesWithResponse);
      serviceRef.current.saveMessages(messagesWithResponse);

    } catch (err) {
      console.error('Error sending message:', err);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };
      
      const messagesWithError = [...updatedMessages, errorMessage];
      setMessages(messagesWithError);
      serviceRef.current.saveMessages(messagesWithError);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error && !config) {
    return null;
  }

  const themeColor = primaryColor || config?.primaryColor || '#007bff';
  const positionClass = `askmysite-position-${position}`;

  return (
    <div className={`askmysite-container ${positionClass}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          className="askmysite-button"
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: themeColor }}
          aria-label="Open chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && config && (
        <div className="askmysite-chat-window">
          {/* Header */}
          <div className="askmysite-header" style={{ backgroundColor: themeColor }}>
            <div className="askmysite-header-content">
              {config.avatarUrl && (
                <img
                  src={config.avatarUrl}
                  alt={config.chatbotName}
                  className="askmysite-avatar"
                />
              )}
              <div className="askmysite-header-text">
                <h3>{config.chatbotName}</h3>
                <span className="askmysite-status">Online</span>
              </div>
            </div>
            <button
              className="askmysite-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="askmysite-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`askmysite-message askmysite-message-${message.role}`}
              >
                {message.role === 'assistant' && config.avatarUrl && (
                  <img
                    src={config.avatarUrl}
                    alt={config.chatbotName}
                    className="askmysite-message-avatar"
                  />
                )}
                <div
                  className="askmysite-message-bubble"
                  style={
                    message.role === 'user'
                      ? { backgroundColor: themeColor }
                      : {}
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="askmysite-message askmysite-message-assistant">
                {config.avatarUrl && (
                  <img
                    src={config.avatarUrl}
                    alt={config.chatbotName}
                    className="askmysite-message-avatar"
                  />
                )}
                <div className="askmysite-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="askmysite-input-container">
            <input
              type="text"
              className="askmysite-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="askmysite-send-button"
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              style={{ color: themeColor }}
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
