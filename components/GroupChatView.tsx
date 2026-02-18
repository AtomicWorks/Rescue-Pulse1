import React, { useEffect, useState, useRef } from 'react';
import { User, AlertMessage } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';

interface GroupChatViewProps {
    currentUser: User;
    alertId: string;
    alertTitle: string;
    onBack: () => void;
}

const GroupChatView: React.FC<GroupChatViewProps> = ({ currentUser, alertId, alertTitle, onBack }) => {
    const { isDark } = useTheme();
    const d = isDark;
    const [messages, setMessages] = useState<AlertMessage[]>([]);
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
                .from('alert_messages')
                .select('*')
                .eq('alert_id', alertId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) console.error('Error fetching messages:', error);
            if (data) setMessages(data as AlertMessage[]);
            setLoading(false);
        };

        fetchMessages();

        const channel = supabase
            .channel(`alert_chat_${alertId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'alert_messages',
                    filter: `alert_id=eq.${alertId}`,
                },
                (payload) => {
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new as AlertMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [alertId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        // Optimistic
        const optimisticMsg: AlertMessage = {
            id: Date.now().toString(),
            alert_id: alertId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            message: msgContent,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        const { error } = await supabase.from('alert_messages').insert([{
            alert_id: alertId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar || null,
            message: msgContent,
        }]);

        if (error) {
            console.error('Error sending message:', error);
            // Rollback optimistic update if needed, but simplistic approach for now
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${d ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
                        }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <h3 className={`font-bold ${d ? 'text-white' : 'text-slate-900'}`}>{alertTitle}</h3>
                        <p className="text-xs text-emerald-400 font-medium">Group Chat</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${d ? '' : 'bg-slate-50'}`} style={d ? { background: 'rgba(10, 14, 26, 0.4)' } : {}}>
                {loading ? (
                    <div className={`flex items-center justify-center h-full text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>Loading history...</div>
                ) : messages.length === 0 ? (
                    <div className={`flex items-center justify-center h-full text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>No messages yet. Start the coordination!</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <span className={`text-[10px] mb-1 ml-1 ${d ? 'text-slate-500' : 'text-slate-400'}`}>{msg.user_name}</span>
                                )}
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} max-w-[85%]`}>
                                    {!isMe && (
                                        <div className="mr-2 mt-auto">
                                            {msg.user_avatar ? (
                                                <img src={msg.user_avatar} className="w-6 h-6 rounded-full" alt={msg.user_name} />
                                            ) : (
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${d ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                                    {msg.user_name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe
                                            ? (d ? 'bg-gradient-to-br from-cyan-600 to-teal-500 text-white rounded-br-none' : 'bg-slate-900 text-white rounded-br-none')
                                            : (d ? 'bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-bl-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none')
                                            }`}
                                    >
                                        <p>{msg.message}</p>
                                        <span className={`text-[10px] block text-right mt-1 ${isMe ? (d ? 'text-cyan-200/60' : 'text-white/60') : (d ? 'text-slate-500' : 'text-slate-400')}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
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

export default GroupChatView;
