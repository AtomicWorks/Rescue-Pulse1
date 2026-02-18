
import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { useTheme } from './ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AIChatBot: React.FC = () => {
  const { isDark } = useTheme();
  const d = isDark;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'intro', role: 'model', text: 'Hi! I\'m RescueBot. I can help with safety tips, first aid advice, or navigating the app. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(userText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I didn't catch that. Could you please repeat?"
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, something went wrong. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 sm:bottom-8 left-4 sm:left-8 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen
            ? (d ? 'bg-slate-700 shadow-black/30 rotate-90' : 'bg-slate-800 shadow-slate-900/30 rotate-90')
            : (d ? 'bg-gradient-to-tr from-cyan-600 to-teal-500 shadow-cyan-500/30' : 'bg-gradient-to-tr from-slate-800 to-slate-700 shadow-slate-900/30')
          }`}
        aria-label="Toggle AI Chatbot"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {isOpen && (
        <div className={`fixed bottom-40 sm:bottom-24 left-4 sm:left-8 z-50 w-[calc(100%-2rem)] sm:w-96 h-[550px] max-h-[60vh] sm:max-h-[70vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden ${d ? 'glass-light shadow-black/40' : 'bg-white shadow-slate-300/50 border border-slate-100'
          }`}>

          <div className={`p-5 flex items-center gap-4 shadow-md ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500' : 'bg-gradient-to-r from-slate-800 to-slate-700'
            }`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">RescueBot</h3>
              <p className={`text-xs font-medium opacity-90 ${d ? 'text-cyan-100' : 'text-slate-300'}`}>Always here to help</p>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${d ? '' : 'bg-slate-50'}`} style={d ? { background: 'rgba(10, 14, 26, 0.6)' } : {}}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                      ? (d ? 'bg-gradient-to-br from-cyan-600 to-teal-500 text-white rounded-br-none shadow-cyan-500/20' : 'bg-slate-900 text-white rounded-br-none shadow-slate-900/20')
                      : (d ? 'bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-bl-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none')
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start w-full">
                <div className={`px-5 py-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5 ${d ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-white border border-slate-100'
                  }`}>
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={`p-4 border-t flex gap-3 ${d ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-100'
            }`}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className={`flex-1 px-5 py-3 rounded-2xl outline-none transition-all text-sm font-medium focus:ring-2 ${d ? 'bg-white/5 border border-white/10 focus:bg-white/10 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400'
                }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`p-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${d ? 'bg-gradient-to-br from-cyan-600 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
