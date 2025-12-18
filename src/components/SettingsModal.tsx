"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Key, Save, Trash2 } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface SettingsModalProps {
    onClose: () => void;
    onSaveKey: (key: string) => void;
    currentKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaveKey, currentKey }) => {
    const [apiKey, setApiKey] = useState(currentKey);

    useEffect(() => {
        setApiKey(currentKey);
    }, [currentKey]);

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.2 } }}
                className="modal-container no-drag"
            >
                <GlassCard className="modal-card">
                    <div className="modal-header">
                        <div className="header-title">
                            <div className="icon-badge">
                                <Key size={18} className="text-blue-400" />
                            </div>
                            <h3>Intelligence Settings</h3>
                        </div>
                        <button onClick={onClose} className="close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="input-group">
                            <label>Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Gemini API Key..."
                                className="futuristic-input"
                            />
                            <p className="input-hint">Your key is stored locally and never leaves your machine.</p>
                        </div>

                        <div className="actions-cluster">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSaveKey(apiKey)}
                                className="save-btn"
                            >
                                <Save size={16} />
                                <span>Synchronize Key</span>
                            </motion.button>

                            <button
                                onClick={() => { setApiKey(""); onSaveKey(""); }}
                                className="clear-btn"
                            >
                                <Trash2 size={14} />
                                <span>Wipe Stored Keys</span>
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .modal-container {
          width: 100%;
          max-width: 480px;
        }
        :global(.modal-card) {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(10, 10, 15, 0.8) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 16px;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-badge {
          padding: 8px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.01em;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-btn:hover {
          color: white;
        }
        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        label {
          font-size: 0.7rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .futuristic-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          color: white;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        .futuristic-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
        }
        .input-hint {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 4px;
        }
        .actions-cluster {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .save-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
        }
        .clear-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: rgba(239, 68, 68, 0.6);
          border-radius: 12px;
          padding: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
        }
      `}</style>
        </div>
    );
};
