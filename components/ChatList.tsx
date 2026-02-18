import React, { useEffect, useState } from 'react';
import { User, ChatMessage } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';

interface ChatListProps {
  currentUser: User;
  onSelectUser: (user: { id: string; name: string; avatar?: string }) => void;
  onBack: () => void;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  lastMessage: string;
  timestamp: string;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectUser, onBack }) => {
  const { isDark } = useTheme();
  const d = isDark;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      // Fetch all messages where current user is sender OR receiver
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      const rawMessages = data as ChatMessage[];
      const convoMap = new Map<string, Conversation>();

      rawMessages.forEach((msg) => {
        const isSender = msg.sender_id === currentUser.id;
        const partnerId = isSender ? msg.receiver_id : msg.sender_id;

        // Only process if we haven't seen this partner yet (since we ordered by desc, first one is latest)
        if (!convoMap.has(partnerId)) {

          let partnerName = 'Unknown User';
          let partnerAvatar = '';

          if (!isSender) {
            partnerName = msg.sender_name;
            partnerAvatar = msg.sender_avatar || '';
          } else {
            // If I am the sender, we try to find a message from them in the rest of the array to get their name
            const msgFromThem = rawMessages.find(m => m.sender_id === partnerId);
            if (msgFromThem) {
              partnerName = msgFromThem.sender_name;
              partnerAvatar = msgFromThem.sender_avatar || '';
            }
            // If msgFromThem is missing, partnerName remains 'Unknown User'
          }

          convoMap.set(partnerId, {
            partnerId,
            partnerName,
            partnerAvatar,
            lastMessage: msg.content,
            timestamp: msg.created_at
          });
        }
      });

      // 2. Resolve "Unknown User" names by checking the Alerts table
      const unknownIds = Array.from(convoMap.values())
        .filter(c => c.partnerName === 'Unknown User')
        .map(c => c.partnerId);

      if (unknownIds.length > 0) {
        const { data: alertUsers } = await supabase
          .from('alerts')
          .select('user_id, user_name, user_avatar')
          .in('user_id', unknownIds);

        const { data: commentUsers } = await supabase
          .from('comments')
          .select('user_id, user_name, user_avatar')
          .in('user_id', unknownIds);

        const updateConvoMap = (users: any[]) => {
          if (!users) return;
          users.forEach(u => {
            const c = convoMap.get(u.user_id);
            if (c && c.partnerName === 'Unknown User') {
              c.partnerName = u.user_name;
              c.partnerAvatar = u.user_avatar || `https://ui-avatars.com/api/?name=${u.user_name}&background=random`;
            }
          });
        };

        if (alertUsers) updateConvoMap(alertUsers);
        if (commentUsers) updateConvoMap(commentUsers);
      }

      setConversations(Array.from(convoMap.values()));
      setLoading(false);
    };

    fetchConversations();
  }, [currentUser]);

  return (
    <div className={`rounded-2xl shadow-lg overflow-hidden min-h-[400px] theme-transition ${d ? 'glass-light shadow-black/20' : 'bg-white shadow-slate-200/50 border border-slate-100'
      }`}>
      <div className={`p-4 border-b flex justify-between items-center ${d ? 'border-white/[0.06]' : 'border-slate-100'
        }`}>
        <h2 className={`text-xl font-bold ${d ? 'text-white' : 'text-slate-900'}`}>Messages</h2>
        <button onClick={onBack} className={`text-sm font-semibold transition-colors flex items-center gap-1 ${d ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
          }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Home
        </button>
      </div>

      <div className={`divide-y ${d ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
        {loading ? (
          <div className={`p-8 text-center text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${d ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
              <svg className={`w-8 h-8 ${d ? 'text-slate-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className={`font-medium ${d ? 'text-white' : 'text-slate-900'}`}>No messages yet</h3>
            <p className={`text-sm mt-1 ${d ? 'text-slate-500' : 'text-slate-400'}`}>Connect with neighbors on the feed to start chatting.</p>
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.partnerId}
              onClick={() => onSelectUser({ id: convo.partnerId, name: convo.partnerName, avatar: convo.partnerAvatar })}
              className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${d ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
            >
              <div className="relative">
                <img
                  src={convo.partnerAvatar || `https://ui-avatars.com/api/?name=${convo.partnerName}&background=random`}
                  alt={convo.partnerName}
                  className={`w-12 h-12 rounded-full object-cover border ${d ? 'border-white/10' : 'border-slate-100'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`font-bold truncate ${d ? 'text-white' : 'text-slate-900'}`}>{convo.partnerName}</h3>
                  <span className={`text-xs whitespace-nowrap ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(convo.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                      ? new Date(convo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(convo.timestamp).toLocaleDateString()
                    }
                  </span>
                </div>
                <p className={`text-sm truncate ${d ? 'text-slate-500' : 'text-slate-400'}`}>{convo.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;