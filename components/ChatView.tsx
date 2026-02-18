import React, { useEffect, useState, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';

interface ChatViewProps {
  currentUser: User;
  chatPartner: { id: string; name: string; avatar?: string };
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, chatPartner, onBack }) => {
  const { isDark } = useTheme();
  const d = isDark;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${chatPartner.id}),and(sender_id.eq.${chatPartner.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) console.error('Error fetching messages:', error);
      if (data) setMessages(data as ChatMessage[]);
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_room')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.sender_id === chatPartner.id) {
              setMessages((prev) => [...prev, payload.new as ChatMessage]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Handle message updates (e.g. name change, though bubble mostly shows content)
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as ChatMessage : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, chatPartner.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      receiver_id: chatPartner.id,
      content: msgContent,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from('messages').insert([{
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      receiver_id: chatPartner.id,
      content: msgContent,
    }]);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-140px)] sm:h-[600px] rounded-2xl shadow-lg overflow-hidden theme-transition ${d ? 'glass-light shadow-black/20' : 'bg-white shadow-slate-200/50 border border-slate-100'
      }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center gap-3 ${d ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
        }`}>
        <button onClick={onBack} className={`p-2 rounded-full transition-colors ${d ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
          <svg className={`w-5 h-5 ${d ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-3">
          {chatPartner.avatar ? (
            <img src={chatPartner.avatar} className={`w-10 h-10 rounded-full border ${d ? 'border-white/10' : 'border-slate-100'}`} alt={chatPartner.name} />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${d ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
              {chatPartner.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className={`font-bold ${d ? 'text-white' : 'text-slate-900'}`}>{chatPartner.name}</h3>
            <p className="text-xs text-emerald-400 font-medium">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${d ? '' : 'bg-slate-50'}`} style={d ? { background: 'rgba(10, 14, 26, 0.4)' } : {}}>
        {loading ? (
          <div className={`flex items-center justify-center h-full text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>Loading history...</div>
        ) : messages.length === 0 ? (
          <div className={`flex items-center justify-center h-full text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>Start the conversation...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe
                    ? (d ? 'bg-gradient-to-br from-cyan-600 to-teal-500 text-white rounded-br-none' : 'bg-slate-900 text-white rounded-br-none')
                    : (d ? 'bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-bl-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none')
                    }`}
                >
                  <p>{msg.content}</p>
                  <span className={`text-[10px] block text-right mt-1 ${isMe ? (d ? 'text-cyan-200/60' : 'text-white/60') : (d ? 'text-slate-500' : 'text-slate-400')}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className={`p-4 border-t flex gap-2 ${d ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-100'
        }`}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={`flex-1 px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 ${d ? 'bg-white/5 border border-white/10 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
              : 'bg-slate-50 border border-slate-200 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400'
            }`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className={`text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/20' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
};

export default ChatView;