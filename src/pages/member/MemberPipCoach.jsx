import { useState, useRef, useEffect } from 'react';
import { askPipCoach } from '../../services/pipAiService.js';

function createInitialMessages() {
  const createdAt = Date.now();
  return [{
    id: createdAt,
    createdAt,
    sender: 'bot',
    text: "Hey Trader! I'm Pip, your AI Trading Coach. Upload or paste a chart screenshot, or tell me the asset you're watching, and I'll give you an estimated signal with Entry, TP, and SL. What setup are we analyzing?",
  }];
}

const PRESET_QUESTIONS = [
  '📋 Run 5-Point ICT Audit & Signal on this chart',
  '🎯 Estimate a signal for XAUUSD (Gold) right now',
  'What is the difference between BOS and CHoCH?',
  'How do I calculate lot size for a $1,000 account?',
];

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function formatSessionDate(timestamp) {
  if (!timestamp) return 'Recently';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${timeStr}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${timeStr}`;
}

function formatMessageTime(message, now) {
  const timestamp = Number(message.createdAt || message.id);
  if (!Number.isFinite(timestamp) || timestamp < 100_000_000_000) {
    return message.time && message.time.toLowerCase() !== 'just now' ? message.time : 'Recently';
  }
  const elapsed = Math.max(0, now - timestamp);
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 60 * 60_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 24 * 60 * 60_000) return `${Math.floor(elapsed / (60 * 60_000))}h ago`;
  if (elapsed < 7 * 24 * 60 * 60_000) return `${Math.floor(elapsed / (24 * 60 * 60_000))}d ago`;
  return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MemberPipCoach({ user }) {
  const sessionsStorageKey = `genz_pip_sessions_${user?.uid || 'guest'}`;

  // Load existing sessions from storage (including migration from old single-thread chat)
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(sessionsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migration from previous single-thread storage
      const legacyKey = `genz_pip_chat_${user?.uid || 'guest'}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacyMsgs = JSON.parse(legacyRaw);
        const userMsg = legacyMsgs.find((m) => m.sender === 'user');
        if (userMsg) {
          const migrated = [
            {
              id: 'sess_migrated_' + Date.now(),
              title: userMsg.text.slice(0, 45) + (userMsg.text.length > 45 ? '...' : ''),
              createdAt: userMsg.id || Date.now(),
              updatedAt: Date.now(),
              messages: legacyMsgs,
            },
          ];
          localStorage.setItem(sessionsStorageKey, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat sessions', e);
    }
    return [];
  });

  // Always start a brand new fresh chat on page load/comeback as requested!
  const [activeSessionId, setActiveSessionId] = useState(() => 'sess_' + Date.now());
  const [messages, setMessages] = useState(createInitialMessages);
  const [clockNow, setClockNow] = useState(Date.now);
  const [showHistory, setShowHistory] = useState(false);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Persist sessions list to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
    } catch (err) {
      console.warn('Failed to save sessions', err);
    }
  }, [sessions, sessionsStorageKey]);

  function startNewChat() {
    setActiveSessionId('sess_' + Date.now());
    setMessages(createInitialMessages());
    setInput('');
    setAttachedImage(null);
  }

  function selectSession(session) {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setInput('');
    setAttachedImage(null);
  }

  function deleteSession(sessionId, e) {
    e.stopPropagation();
    if (window.confirm('Delete this conversation history?')) {
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      try {
        localStorage.setItem(sessionsStorageKey, JSON.stringify(updated));
      } catch {}
      if (activeSessionId === sessionId) {
        startNewChat();
      }
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setAttachedImage(reader.result);
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  }

  function saveMessageToSession(newMessages, promptTitle) {
    setSessions((prevSessions) => {
      const existingIdx = prevSessions.findIndex((s) => s.id === activeSessionId);
      if (existingIdx >= 0) {
        // Update existing session
        const updated = [...prevSessions];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages: newMessages,
          updatedAt: Date.now(),
        };
        // Move most recently updated session to top
        const item = updated.splice(existingIdx, 1)[0];
        return [item, ...updated];
      } else {
        // Create new session in history
        const newTitle = promptTitle
          ? promptTitle.slice(0, 48) + (promptTitle.length > 48 ? '...' : '')
          : 'Chart Analysis';
        const newSession = {
          id: activeSessionId,
          title: newTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: newMessages,
        };
        return [newSession, ...prevSessions];
      }
    });
  }

  async function handleSend(userText) {
    const text = (userText || input).trim();
    if (!text && !attachedImage) return;

    const currentImg = attachedImage;
    const userMsg = {
      id: Date.now(),
      createdAt: Date.now(),
      sender: 'user',
      text: text || '(Attached Chart Screenshot for analysis)',
      image: currentImg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    saveMessageToSession(updatedWithUser, text);

    if (!userText) setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    try {
      const defaultImgPrompt = 'Please analyze this chart and provide an estimated signal with Entry, Stop Loss (SL), Take Profit (TP), and key confluence.';
      const promptToSend = text || defaultImgPrompt;
      const response = await askPipCoach(
        updatedWithUser,
        promptToSend,
        currentImg
      );
      const botMsg = {
        id: Date.now() + 1,
        createdAt: Date.now(),
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedWithUser, botMsg];
      setMessages(finalMessages);
      saveMessageToSession(finalMessages, text);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        createdAt: Date.now(),
        sender: 'bot',
        text: `⚠️ An error occurred while generating a response: ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedWithUser, errorMsg];
      setMessages(finalMessages);
      saveMessageToSession(finalMessages, text);
    } finally {
      setIsTyping(false);
    }
  }

  function clearCurrentChat() {
    if (window.confirm('Reset this conversation?')) {
      const initialMessages = createInitialMessages();
      setMessages(initialMessages);
      saveMessageToSession(initialMessages);
    }
  }

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const activeTitle = currentSession?.title || 'New Conversation';

  return (
    <div className="pip-terminal-wrapper" onPaste={handlePaste}>
      {/* HEADER */}
      <div className="pip-terminal-head">
        <div className="pip-head-left">
          <div className="pip-bot-badge">
            <div className="pip-pulse-dot" />
            <span>Pip Coach • Online</span>
          </div>
          <div className="pip-active-session-title" title={activeTitle}>
            💬 {activeTitle}
          </div>
        </div>

        <div className="pip-head-actions">
          <button
            type="button"
            className="pip-new-chat-top-btn"
            onClick={startNewChat}
            title="Start a fresh conversation"
          >
            + New Chat
          </button>

          <button
            type="button"
            className={`pip-history-toggle-btn${showHistory ? ' active' : ''}`}
            onClick={() => setShowHistory((prev) => !prev)}
            title="View past conversation history"
          >
            <span>📜 Chat History</span>
            <span className="pip-history-badge">{sessions.length}</span>
          </button>

          <button
            type="button"
            className="pip-clear-btn"
            onClick={clearCurrentChat}
            title="Reset current conversation"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* 2-PANEL BODY: HISTORY SIDEBAR + MAIN CHAT */}
      <div className="pip-terminal-body">
        {/* CHAT HISTORY DRAWER / SIDEBAR */}
        {showHistory && (
          <aside className="pip-history-sidebar">
            <div className="pip-history-top">
              <button
                type="button"
                className="pip-new-chat-btn"
                onClick={startNewChat}
              >
                <span className="plus-icon">+</span>
                <span>Start New Chat</span>
              </button>
            </div>

            <div className="pip-history-list">
              <div className="pip-history-section-label">Your Past Chats ({sessions.length})</div>
              {sessions.length === 0 ? (
                <div className="pip-history-empty">
                  No saved conversations yet. Ask Pip anything below to begin saving history!
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const userCount = s.messages.filter((m) => m.sender === 'user').length;
                  return (
                    <div
                      key={s.id}
                      className={`pip-history-item${isActive ? ' active' : ''}`}
                      onClick={() => selectSession(s)}
                      title={`Click to continue "${s.title}"`}
                    >
                      <div className="pip-history-item-icon">💬</div>
                      <div className="pip-history-item-meta">
                        <div className="pip-history-item-title">{s.title}</div>
                        <div className="pip-history-item-date">
                          {formatSessionDate(s.updatedAt || s.createdAt)} • {userCount} {userCount === 1 ? 'question' : 'questions'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="pip-history-del-btn"
                        onClick={(e) => deleteSession(s.id, e)}
                        title="Delete chat"
                        aria-label="Delete chat"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* MAIN CHAT AREA */}
        <div className="pip-main-chat-area">
          {/* CHAT WINDOW */}
          <div className="pip-chat-window">
            {messages.map((m) => (
              <div key={m.id} className={`pip-msg-row ${m.sender}`}>
                {m.sender === 'bot' && <div className="pip-avatar-bot">🤖</div>}
                <div className="pip-bubble">
                  {m.image && (
                    <div className="pip-msg-img-wrap">
                      <img src={m.image} alt="Chart snippet" className="pip-chat-img" />
                    </div>
                  )}
                  <div className="pip-msg-text">{m.text}</div>
                  <div className="pip-msg-time">{formatMessageTime(m, clockNow)}</div>
                </div>
                {m.sender === 'user' && (
                  <div className="pip-avatar-user" title={user?.name || user?.email || 'You'}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="pip-avatar-user-img" />
                    ) : (
                      (user?.name || user?.email || 'U').slice(0, 1).toUpperCase()
                    )}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="pip-msg-row bot">
                <div className="pip-avatar-bot">🤖</div>
                <div className="pip-bubble typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* ATTACHED IMAGE PREVIEW */}
          {attachedImage && (
            <div className="pip-attached-banner">
              <img src={attachedImage} alt="Attachment" className="pip-attached-thumb" />
              <div className="pip-attached-info">
                <span className="pip-attached-title">Chart Attached</span>
                <span className="pip-attached-sub">Ready for Pip's ICT analysis</span>
              </div>
              <button
                type="button"
                className="pip-remove-img-btn"
                onClick={() => setAttachedImage(null)}
              >
                ✕ Remove
              </button>
            </div>
          )}

          {/* SUGGESTIONS BAR */}
          <div className="pip-suggestions-bar">
            <span className="pip-suggestions-label">Quick ICT Prompts:</span>
            <div className="pip-chips-scroll">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="pip-preset-btn"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM */}
          <form
            className="pip-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              className="pip-attach-btn"
              title="Upload or paste Chart Screenshot (PNG/JPG)"
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraIcon />
            </button>

            <input
              type="text"
              className="pip-terminal-input"
              placeholder="Ask Pip anything about ICT, paste chart screenshot (Ctrl+V)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button type="submit" className="pip-send-btn" disabled={!input.trim() && !attachedImage}>
              <span>Ask Pip</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
