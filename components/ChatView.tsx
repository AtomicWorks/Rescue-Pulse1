import React, { useEffect, useState, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { supabase } from '../services/supabaseClient';

interface ChatViewProps {
  currentUser: User;
  chatPartner: { id: string; name: string; avatar?: string };
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, chatPartner, onBack }) => {
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
      // Rollback could happen here, but keeping it simple
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[600px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-3">
            {chatPartner.avatar ? (
                 <img src={chatPartner.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt={chatPartner.name} />
            ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                    {chatPartner.name.charAt(0)}
                </div>
            )}
          <div>
            <h3 className="font-bold text-gray-900">{chatPartner.name}</h3>
            <p className="text-xs text-green-600 font-medium">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading history...</div>
        ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Start the conversation...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-slate-400' : 'text-gray-400'}`}>
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
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
};

export default ChatView;