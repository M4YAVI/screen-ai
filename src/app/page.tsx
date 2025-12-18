"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  MessageSquare,
  Wand2,
  HelpCircle,
  Search,
  RefreshCw,
  ChevronDown,
  Pause,
  Square,
  GripVertical,
  X,
  Send,
  Sparkles,
  Maximize2,
  Copy,
  Settings,
  Key,
  Save,
  Trash2
} from "lucide-react";
import { GeminiModel, getGeminiResponse } from "@/lib/gemini";
import styles from "./page.module.css";

const MODELS: { id: GeminiModel; label: string }[] = [
  { id: "gemini-2.0-flash", label: "2.0 Flash" },
  { id: "gemini-2.5-flash", label: "2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "2.5 Lite" },
  { id: "gemini-3-flash", label: "3.0 Flash" },
];

export default function CluleyApp() {
  const [isVisible, setIsVisible] = useState(true);
  const [model, setModel] = useState<GeminiModel>("gemini-2.0-flash");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "transcript">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Load API Key
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    } else {
      setShowSettings(true);
    }
  }, []);

  // Global Keyboard Shortcut: Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    localStorage.setItem("gemini_api_key", tempApiKey);
    setShowSettings(false);
  };

  const handleClearApiKey = () => {
    setApiKey("");
    setTempApiKey("");
    localStorage.removeItem("gemini_api_key");
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const response = await getGeminiResponse(input, model, undefined, apiKey);
    setMessages(prev => [...prev, { role: "ai", content: response }]);
    setIsLoading(false);
  };

  const quickActions = [
    { icon: Wand2, label: "What should I say?" },
    { icon: HelpCircle, label: "Follow-up questions" },
    { icon: Search, label: "Fact-check" },
    { icon: RefreshCw, label: "Recap" },
  ];

  if (!isVisible) {
    return (
      <div className={styles.hiddenHint}>
        <span>Press <kbd>Ctrl</kbd> + <kbd>/</kbd> to show Cluely</span>
      </div>
    );
  }

  return (
    <main className={styles.overlay}>
      <div
        className={styles.floatingContainer}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {/* Control Bar */}
        <motion.div
          className={styles.controlBar}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Model Selector */}
          <div className={styles.modelSelector}>
            <button
              className={styles.modelBtn}
              onClick={() => setShowModelMenu(!showModelMenu)}
            >
              <span>{MODELS.find(m => m.id === model)?.label || "General"}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  className={styles.modelMenu}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      className={`${styles.modelMenuItem} ${model === m.id ? styles.active : ""}`}
                      onClick={() => { setModel(m.id); setShowModelMenu(false); }}
                    >
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recording Controls */}
          <div className={styles.recordingControls}>
            <button
              className={`${styles.controlBtn} ${isRecording ? styles.active : ""}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Pause size={16} />
            </button>
            <button className={styles.controlBtn}>
              <Square size={14} />
            </button>
          </div>

          {/* Drag Handle - 6 dots */}
          <button
            className={styles.dragHandle}
            onMouseDown={handleDragStart}
            title="Drag to move"
          >
            <GripVertical size={16} />
          </button>

          {/* Settings Button */}
          <button
            className={styles.controlBtn}
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Close Button */}
          <button
            className={styles.closeBtn}
            onClick={() => setIsVisible(false)}
          >
            <X size={16} />
          </button>
        </motion.div>

        {/* Chat Panel */}
        <motion.div
          className={styles.chatPanel}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Panel Header */}
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <button className={styles.homeBtn}>
                <HomeIcon size={18} />
              </button>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === "chat" ? styles.active : ""}`}
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "transcript" ? styles.active : ""}`}
                  onClick={() => setActiveTab("transcript")}
                >
                  Transcript
                </button>
              </div>
            </div>
            <button className={styles.expandBtn}>
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea}>
            {messages.length === 0 ? (
              <div className={styles.emptyChat}>
                <p>Ask about your screen or conversation, or press ↵ for Assist</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.message} ${msg.role === "user" ? styles.userMsg : styles.aiMsg}`}
                >
                  {msg.role === "user" && (
                    <div className={styles.userBubble}>{msg.content}</div>
                  )}
                  {msg.role === "ai" && (
                    <div className={styles.aiContent}>
                      <div className={styles.aiText}>{msg.content}</div>
                      <button className={styles.copyBtn}>
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className={styles.loadingMsg}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {quickActions.map((action, i) => (
              <button key={i} className={styles.quickAction}>
                <action.icon size={14} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Click to type, or ↑ ↵ for assist"
              className={styles.textInput}
            />
            <div className={styles.inputActions}>
              <div className={styles.modelIndicator}>
                <Sparkles size={12} />
                <span>Smart</span>
              </div>
              <button className={styles.sendBtn} onClick={handleSend}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className={styles.settingsModal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <Key size={18} />
                  <h3>Settings</h3>
                </div>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowSettings(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <label>Gemini API Key</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className={styles.apiInput}
                />
                <p className={styles.apiHint}>Your key is stored locally and never shared.</p>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.clearBtn} onClick={handleClearApiKey}>
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
                <button className={styles.saveBtn} onClick={handleSaveApiKey}>
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
