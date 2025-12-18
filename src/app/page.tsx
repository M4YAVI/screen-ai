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
  Trash2,
  Camera,
  Globe,
  Plus,
  Edit2,
  Command
} from "lucide-react";
import { GeminiModel, getGeminiResponse } from "@/lib/gemini";
import styles from "./page.module.css";

const MODELS: { id: GeminiModel; label: string }[] = [
  { id: "gemini-2.5-flash", label: "2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "2.5 Lite" },
  { id: "gemini-3-flash", label: "3.0 Flash" },
];

interface SlashCommand {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_COMMANDS: SlashCommand[] = [
  { id: "1", name: "super-thinker", description: "Think deeply about this problem step-by-step." },
  { id: "2", name: "smart-friend", description: "Explain this like a supportive and intelligent friend." },
];

export default function CluleyApp() {
  const [isVisible, setIsVisible] = useState(true);
  const [model, setModel] = useState<GeminiModel>("gemini-2.5-flash"); // Fixed default
  // ... existing state
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Slash Command State
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>(DEFAULT_COMMANDS);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [activePill, setActivePill] = useState<SlashCommand | null>(null);
  const [editingCommand, setEditingCommand] = useState<SlashCommand | null>(null);
  const [newCommandName, setNewCommandName] = useState("");
  const [newCommandDesc, setNewCommandDesc] = useState("");

  const [apiKey, setApiKey] = useState("");

  const [tempApiKey, setTempApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "transcript">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useGrounding, setUseGrounding] = useState(false);
  const [useScreenContext, setUseScreenContext] = useState(true); // Default ON

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Load Commands
  useEffect(() => {
    const saved = localStorage.getItem("cluely_commands");
    if (saved) {
      setSlashCommands(JSON.parse(saved));
    }
  }, []);

  // Save Commands
  useEffect(() => {
    localStorage.setItem("cluely_commands", JSON.stringify(slashCommands));
  }, [slashCommands]);

  const handleAddCommand = () => {
    if (!newCommandName.trim() || !newCommandDesc.trim()) return;

    if (editingCommand) {
      setSlashCommands(prev => prev.map(c =>
        c.id === editingCommand.id
          ? { ...c, name: newCommandName, description: newCommandDesc }
          : c
      ));
    } else {
      const newCmd: SlashCommand = {
        id: Date.now().toString(),
        name: newCommandName.startsWith("/") ? newCommandName.slice(1) : newCommandName,
        description: newCommandDesc
      };
      setSlashCommands(prev => [...prev, newCmd]);
    }

    closeCommandModal();
  };

  const handleDeleteCommand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlashCommands(prev => prev.filter(c => c.id !== id));
  };

  const openEditModal = (cmd: SlashCommand, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCommand(cmd);
    setNewCommandName(cmd.name);
    setNewCommandDesc(cmd.description);
    setShowCommandModal(true);
  };

  const closeCommandModal = () => {
    setShowCommandModal(false);
    setEditingCommand(null);
    setNewCommandName("");
    setNewCommandDesc("");
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setActivePill(cmd);
    setInput("");
    setShowSlashMenu(false);
  };



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

  // ...
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // ...

  const handleSend = async () => {
    // If no input and no screen context and no pill, do nothing
    if (!input.trim() && !useScreenContext && !activePill) return;

    // Check API Key
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    let finalInput = input.trim();

    // Prepend Pill Prompt if active
    if (activePill) {
      // If input is empty, just use the prompt
      if (!finalInput) {
        finalInput = activePill.description;
      } else {
        finalInput = `${activePill.description}\n\n${finalInput}`;
      }
    }

    // If strictly image mode (no text), provide a default prompt
    if (!finalInput && useScreenContext) {
      finalInput = "Analyze this screen and tell me what you see.";
    }

    const userMsg = { role: "user" as const, content: finalInput };

    setIsLoading(true);

    // Capture screen if enabled
    let currentScreenshot = null;
    if (useScreenContext) {
      try {
        // @ts-ignore
        currentScreenshot = await window.electron.invoke('capture-screen');
        if (currentScreenshot) {
          userMsg.content = "[Screen Context] " + userMsg.content;
        }
      } catch (err) {
        console.error("Auto-capture failed:", err);
      }
    }

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setActivePill(null); // Clear pill after sending

    try {
      const response = await getGeminiResponse(
        finalInput,
        model,
        currentScreenshot || undefined,
        apiKey,
        useGrounding
      );
      setMessages(prev => [...prev, { role: "ai", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Error: Could not get response." }]);
    } finally {
      setIsLoading(false);
    }
  };


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
            <button
              className={`${styles.quickAction} ${useScreenContext ? styles.active : ""}`}
              onClick={() => setUseScreenContext(!useScreenContext)}
            >
              <Camera size={14} />
              <span>{useScreenContext ? "Screen Context: ON" : "Screen Context: OFF"}</span>
            </button>
            <button
              className={`${styles.quickAction} ${useGrounding ? styles.active : ""}`}
              onClick={() => setUseGrounding(!useGrounding)}
            >
              <Globe size={14} />
              <span>{useGrounding ? "Grounding: ON" : "Grounding: OFF"}</span>
            </button>
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            {/* Pill Container (if active) */}
            {activePill && (
              <div className={styles.pillContainer}>
                <div className={styles.badgePill}>
                  <Sparkles size={10} />
                  <span>/{activePill.name}</span>
                  <button onClick={() => setActivePill(null)}><X size={10} /></button>
                </div>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                if (val.startsWith("/")) {
                  setShowSlashMenu(true);
                } else {
                  setShowSlashMenu(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
                // Close menu on escape
                if (e.key === "Escape") setShowSlashMenu(false);
                // Backspace removes pill if input empty
                if (e.key === "Backspace" && input === "" && activePill) {
                  setActivePill(null);
                }
              }}
              placeholder={activePill ? "Type your prompt..." : "Click to type, or / for commands"}
              className={styles.textInput}
            />
            {showSlashMenu && (
              <div className={styles.slashMenu}>
                <div className={styles.slashHeader}>
                  <span>Shortcuts</span>
                  <button
                    className={styles.addCmdBtn}
                    onClick={() => { setShowSlashMenu(false); setShowCommandModal(true); }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className={styles.slashList}>
                  {slashCommands.map(cmd => (
                    <div
                      key={cmd.id}
                      className={styles.slashItem}
                      onClick={() => handleSlashSelect(cmd)}
                    >
                      <div className={styles.slashContent}>
                        <span className={styles.cmdName}>/{cmd.name}</span>
                        <span className={styles.cmdDesc}>{cmd.description}</span>
                      </div>
                      <div className={styles.slashActions}>
                        <button onClick={(e) => openEditModal(cmd, e)}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => handleDeleteCommand(cmd.id, e)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
      </div >

      {/* Command Modal */}
      <AnimatePresence>
        {
          showCommandModal && (
            <motion.div
              className={styles.modalOverlay}
              // reuse existing modal styles or create new ones
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCommandModal}
            >
              <motion.div
                className={styles.settingsModal} // Reusing settings modal style for consistency
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div className={styles.modalTitle}>
                    <Command size={18} />
                    <h3>{editingCommand ? "Edit Shortcut" : "New Shortcut"}</h3>
                  </div>
                  <button className={styles.modalClose} onClick={closeCommandModal}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <label>Shortcut Name (e.g. fix-code)</label>
                  <input
                    className={styles.apiInput}
                    value={newCommandName}
                    onChange={(e) => setNewCommandName(e.target.value)}
                    placeholder="command-name"
                  />
                  <label style={{ marginTop: 12 }}>Prompt Instructions</label>
                  <textarea
                    className={styles.apiInput}
                    style={{ minHeight: 100, resize: 'vertical' }}
                    value={newCommandDesc}
                    onChange={(e) => setNewCommandDesc(e.target.value)}
                    placeholder="What should this command do?"
                  />
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.saveBtn} onClick={handleAddCommand}>
                    <Save size={14} />
                    <span>Save Shortcut</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Settings Modal (Existing) */}
      <AnimatePresence>

        {
          showSettings && (
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
          )
        }
      </AnimatePresence >
    </main >
  );
}
