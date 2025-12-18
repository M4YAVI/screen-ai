"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu, Sparkles, Zap, ZapOff } from "lucide-react";
import { GeminiModel } from "@/lib/gemini";

interface ModelSelectorProps {
    onModelChange: (model: GeminiModel) => void;
    currentModel: GeminiModel;
}

const models: { id: GeminiModel; name: string; icon: React.ReactNode; desc: string }[] = [
    { id: "gemini-2.0-flash", name: "2.0 Flash", icon: <Zap size={16} />, desc: "Fast & Reliable" },
    { id: "gemini-2.5-flash", name: "2.5 Flash", icon: <Sparkles size={16} />, desc: "Experimental" },
    { id: "gemini-2.5-flash-lite", name: "2.5 Lite", icon: <ZapOff size={16} />, desc: "Ultra Low Latency" },
    { id: "gemini-3-flash", name: "3.0 Flash", icon: <Cpu size={16} />, desc: "Next Gen Performance" },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, currentModel }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="model-selector-container">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="glass-btn"
            >
                <div className="flex items-center gap-2">
                    {models.find((m) => m.id === currentModel)?.icon}
                    <span className="font-semibold">{models.find((m) => m.id === currentModel)?.name}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={16} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="glass-dropdown"
                    >
                        {models.map((model) => (
                            <motion.div
                                key={model.id}
                                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                onClick={() => {
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`dropdown-item ${currentModel === model.id ? "active" : ""}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="icon-container">{model.icon}</div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{model.name}</span>
                                        <span className="text-[10px] opacity-60">{model.desc}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .model-selector-container {
          position: relative;
          z-index: 50;
        }
        .glass-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          min-width: 160px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: border-color 0.2s;
        }
        .glass-btn:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }
        .glass-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 220px;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 8px;
          margin-top: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .dropdown-item {
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.8);
        }
        .dropdown-item.active {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border-left: 3px solid #3b82f6;
        }
        .icon-container {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .flex-col { flex-direction: column; }
        .text-sm { font-size: 0.875rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .opacity-60 { opacity: 0.6; }
      `}</style>
        </div>
    );
};
