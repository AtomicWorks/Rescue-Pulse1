
import React, { useState, useEffect } from 'react';
import { EmergencyAlert, User, AlertComment } from '../types';
import { getFirstAidAdvice, findNearbyPlaces } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';

interface AlertCardProps {
  alert: EmergencyAlert;
  onRespond: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
  onVote?: (alertId: string, type: 'up' | 'down') => void;
  onGroupChat?: (alertId: string, alertTitle: string) => void;
  onMessage?: (userId: string, userName: string, userAvatar?: string) => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User | null;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onRespond, onDelete, onVote, onGroupChat, onMessage, onViewProfile, currentUser }) => {
  const { isDark } = useTheme();
  const d = isDark;
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<string | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [comments, setComments] = useState<AlertComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCurrentUser = currentUser?.id === alert.userId;
  const isAnonymous = alert.isAnonymous;

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('alert_id', alert.id)
        .order('created_at', { ascending: true });

      if (data) {
        setComments(data.map(d => ({
          id: d.id,
          alertId: d.alert_id,
          userId: d.user_id,
          userName: d.user_name,
          userAvatar: d.user_avatar,
          text: d.text,
          createdAt: d.created_at
        })));
      }
    };
    fetchComments();

    const channel = supabase.channel(`comments:${alert.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `alert_id=eq.${alert.id}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const nc = payload.new;
          setComments(prev => [...prev, {
            id: nc.id,
            alertId: nc.alert_id,
            userId: nc.user_id,
            userName: nc.user_name,
            userAvatar: nc.user_avatar,
            text: nc.text,
            createdAt: nc.created_at
          }]);
        } else if (payload.eventType === 'UPDATE') {
          const uc = payload.new;
          setComments(prev => prev.map(c => c.id === uc.id ? {
            ...c,
            userName: uc.user_name,
            userAvatar: uc.user_avatar,
            text: uc.text
          } : c));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [alert.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoadingComments(true);
    const text = newComment.trim();
    setNewComment('');

    const { error } = await supabase.from('comments').insert([{
      alert_id: alert.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      text: text
    }]);

    if (error) {
      console.error("Error posting comment:", error);
    }
    setLoadingComments(false);
  };

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getFirstAidAdvice(alert.description, alert.category);
    setAdvice(result || "No specific advice found.");
    setLoadingAdvice(false);
  };

  const fetchNearbyHelp = async () => {
    setLoadingPlaces(true);
    let query = "Hospitals";
    if (alert.category === 'Fire') query = "Fire Stations";
    if (alert.category === 'Security') query = "Police Stations";
    if (alert.category === 'Mechanical') query = "Car Repair Mechanics";

    const result = await findNearbyPlaces(alert.location.lat, alert.location.lng, query);
    setNearbyPlaces(result);
    setLoadingPlaces(false);
  };

  const categoryColors: Record<string, string> = d ? {
    Medical: 'bg-red-500/15 text-red-400 ring-red-500/20',
    Fire: 'bg-orange-500/15 text-orange-400 ring-orange-500/20',
    Security: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
    Mechanical: 'bg-slate-500/15 text-slate-400 ring-slate-500/20',
    Other: 'bg-purple-500/15 text-purple-400 ring-purple-500/20',
  } : {
    Medical: 'bg-red-50 text-red-700 ring-red-600/10',
    Fire: 'bg-orange-50 text-orange-700 ring-orange-600/10',
    Security: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    Mechanical: 'bg-slate-50 text-slate-700 ring-slate-600/10',
    Other: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  };

  const severityBadge = (level: string) => {
    if (d) {
      switch (level) {
        case 'Low': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">Easy Task</span>;
        case 'Medium': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-wide">Medium Task</span>;
        case 'High': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 uppercase tracking-wide">Hard Task</span>;
        default: return null;
      }
    } else {
      switch (level) {
        case 'Low': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">Easy Task</span>;
        case 'Medium': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">Medium Task</span>;
        case 'High': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wide">Hard Task</span>;
        default: return null;
      }
    }
  };

  const isEmergency = alert.isEmergency !== false;

  return (
    <div className={`group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden theme-transition ${d
      ? `glass-light hover:bg-white/[0.07] ${isEmergency ? 'shadow-lg shadow-red-500/10 border-red-500/20' : 'hover:shadow-lg hover:shadow-black/20'}`
      : `bg-white ${isEmergency ? 'shadow-lg shadow-red-100 border border-red-100' : 'shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200'}`
      }`}>

      {/* Background Status Indicator */}
      {alert.status === 'responding' && (
        <div className="absolute -top-6 -right-6 p-4 bg-emerald-500/10 rounded-full opacity-50 blur-xl w-32 h-32 pointer-events-none"></div>
      )}

      {/* Decorative left border for emergency */}
      {isEmergency && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l-3xl"></div>}

      <div className="flex justify-between items-start mb-4 relative z-10 pl-2">
        {/* User Info */}
        <div
          onClick={() => !isAnonymous && onViewProfile && onViewProfile(alert.userId)}
          className={`flex items-center space-x-3.5 ${!isAnonymous ? 'cursor-pointer' : ''}`}
        >
          <div className="relative">
            {isAnonymous ? (
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${d ? 'bg-slate-700 text-slate-300 shadow-black/20' : 'bg-slate-100 text-slate-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            ) : alert.userName ? (
              <img src={alert.userAvatar || `https://ui-avatars.com/api/?name=${alert.userName}`} alt={alert.userName} className={`w-12 h-12 rounded-2xl object-cover border-2 shadow-md group-hover:shadow-lg transition-all ${d ? 'border-white/10' : 'border-white'}`} />
            ) : (
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${d ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                {alert.userName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-lg leading-tight transition-colors ${d ? `text-white ${!isAnonymous && 'group-hover:text-cyan-400'}` : `text-slate-900 ${!isAnonymous && 'group-hover:text-red-600'}`
                }`}>
                {isAnonymous ? 'Anonymous' : alert.userName}
              </h3>
              {isEmergency && <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>}
            </div>
            <p className={`text-xs font-medium mt-0.5 ${d ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(alert.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • {isEmergency ? <span className="text-red-400 font-bold">Emergency</span> : 'Request'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${categoryColors[alert.category] || 'bg-gray-100 text-gray-700'}`}>
              {alert.category}
            </span>
            {!isEmergency && severityBadge(alert.severity)}
          </div>
          {/* Delete button - only for own posts */}
          {isCurrentUser && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className={`p-2 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 ${d ? 'hover:bg-red-500/15 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'
                }`}
              title="Delete post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 pl-2">
        <p className={`text-sm leading-relaxed p-4 rounded-2xl ${d
          ? `text-slate-300 ${isEmergency ? 'bg-red-500/10 border border-red-500/10' : 'bg-white/[0.03] border border-white/[0.06]'}`
          : `text-slate-700 ${isEmergency ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`
          }`}>
          {alert.description}
        </p>
      </div>

      {advice && (
        <div className={`mb-5 p-5 rounded-2xl text-sm backdrop-blur-sm ${d ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
          <h4 className={`font-bold mb-2 flex items-center ${d ? 'text-blue-400' : 'text-blue-700'}`}>
            <svg className={`w-5 h-5 mr-2 ${d ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            AI Safety Advice
          </h4>
          <div className={`whitespace-pre-line ${d ? 'text-blue-300/90' : 'text-blue-700/80'}`}>
            {advice}
          </div>
        </div>
      )}

      {nearbyPlaces && (
        <div className={`mb-5 p-5 rounded-2xl text-sm backdrop-blur-sm ${d ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
          <h4 className={`font-bold mb-2 flex items-center ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <svg className={`w-5 h-5 mr-2 ${d ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Nearby Help Locations
          </h4>
          <div className={`whitespace-pre-line ${d ? 'text-emerald-300/90' : 'text-emerald-700/80'}`}>
            {nearbyPlaces}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2.5 mt-2 pl-2">
        {(isEmergency || alert.severity === 'High') && !advice && (
          <button
            onClick={fetchAdvice}
            disabled={loadingAdvice}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${d ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border-blue-500/20' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100'
              }`}
          >
            {loadingAdvice ? 'Processing...' : 'Ask AI Advice'}
          </button>
        )}

        {!nearbyPlaces && (
          <button
            onClick={fetchNearbyHelp}
            disabled={loadingPlaces}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${d ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
              }`}
          >
            {loadingPlaces ? 'Searching...' : 'Find Places'}
          </button>
        )}

        {!isCurrentUser && (
          <>
            {/* Voting UI */}
            {onVote && (
              <div className={`flex items-center rounded-xl overflow-hidden border ${d ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <button
                  onClick={() => onVote(alert.id, 'up')}
                  className={`p-2.5 transition-colors ${alert.userVote === 1
                    ? (d ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-100 text-orange-600')
                    : (d ? 'text-slate-400 hover:text-orange-400 hover:bg-white/5' : 'text-slate-500 hover:text-orange-500 hover:bg-slate-200')
                    }`}
                >
                  <svg className="w-5 h-5" fill={alert.userVote === 1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                </button>

                <span className={`text-xs font-bold min-w-[20px] text-center ${alert.userVote === 1 ? 'text-orange-500' :
                  alert.userVote === -1 ? 'text-blue-500' :
                    (d ? 'text-slate-300' : 'text-slate-700')
                  }`}>
                  {alert.upvoteCount || 0}
                </span>

                <button
                  onClick={() => onVote(alert.id, 'down')}
                  className={`p-2.5 transition-colors ${alert.userVote === -1
                    ? (d ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-100 text-blue-600')
                    : (d ? 'text-slate-400 hover:text-blue-400 hover:bg-white/5' : 'text-slate-500 hover:text-blue-500 hover:bg-slate-200')
                    }`}
                >
                  <svg className="w-5 h-5" fill={alert.userVote === -1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            )}

            {/* Group Chat Button (Owner + Responders) */}
            {onGroupChat && (isCurrentUser || (currentUser && alert.responders.includes(currentUser.id))) && (
              <button
                onClick={() => onGroupChat(alert.id, `${alert.category}: ${alert.description.substring(0, 20)}...`)}
                className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${d ? 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Group Chat
              </button>
            )}

            {/* Message Button */}
            {onMessage && !isAnonymous && (
              <button
                onClick={() => onMessage(alert.userId, alert.userName, alert.userAvatar)}
                className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${d ? 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border-cyan-500/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Message
              </button>
            )}

            {/* Respond Button */}
            {alert.status !== 'responding' && (
              <button
                onClick={() => onRespond(alert.id)}
                className={`flex-[2] min-w-[120px] py-2.5 px-6 rounded-xl text-white text-xs font-bold shadow-lg transform transition-all hover:scale-105 active:scale-95 ${isEmergency
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20'
                  : (d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 shadow-cyan-500/20' : 'bg-slate-900 shadow-slate-900/20')
                  }`}
              >
                {isEmergency ? 'RESPOND NOW' : 'Offer Help'}
              </button>
            )}
          </>
        )}

        {alert.status === 'responding' && (
          <div className={`flex-[2] py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 backdrop-blur-sm ${d ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Help on the way
          </div>
        )}
      </div>

      {/* Comments Toggle */}
      <div className={`mt-5 pt-3 border-t pl-2 ${d ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`text-xs font-bold flex items-center gap-1.5 transition-colors group/comments ${d ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
            }`}
        >
          <svg className={`w-4 h-4 ${d ? 'text-slate-600 group-hover/comments:text-slate-400' : 'text-slate-300 group-hover/comments:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          {comments.length} Comments
          {showComments
            ? <svg className={`w-3 h-3 ml-1 ${d ? 'text-slate-400' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
            : <svg className={`w-3 h-3 ml-1 ${d ? 'text-slate-400' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          }
        </button>

        {showComments && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-1">
            {/* Comment List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {comments.length === 0 ? (
                <p className={`text-xs italic pl-1 ${d ? 'text-slate-400' : 'text-slate-400'}`}>No comments yet. Start the discussion.</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className={`w-8 h-8 rounded-full mt-1 cursor-pointer object-cover shadow-sm ${d ? 'border border-white/10' : 'border border-slate-100'}`}
                      onClick={() => onViewProfile && onViewProfile(comment.userId)}
                    />
                    <div className={`flex-1 rounded-2xl rounded-tl-none p-3 text-xs ${d ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'
                      }`}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span
                          className={`font-bold cursor-pointer transition-colors ${d ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-700 hover:text-red-600'}`}
                          onClick={() => onViewProfile && onViewProfile(comment.userId)}
                        >
                          {comment.userName}
                        </span>
                        <span className={`text-[10px] font-medium ${d ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className={`leading-relaxed ${d ? 'text-slate-400' : 'text-slate-600'}`}>{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask for details or offer advice..."
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 ${d ? 'bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.08] focus:ring-cyan-500/20 focus:border-cyan-500/30 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400'
                  }`}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || loadingComments}
                className={`rounded-xl px-4 py-1 text-xs font-bold text-white disabled:opacity-50 transition-all ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-md hover:shadow-cyan-500/20' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>

      <div className={`mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider pl-2 ${d ? 'text-slate-400' : 'text-slate-400'}`}>
        <div className="flex items-center">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Location Shared
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          {alert.responders.length} Responding
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {
        showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`absolute inset-0 ${d ? 'bg-[#0A0E1A]/80' : 'bg-white/80'} backdrop-blur-sm`}></div>
            <div className={`relative z-10 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-[90%] sm:max-w-xs w-full text-center ${d ? 'bg-[#141824] border border-white/10 shadow-black/40' : 'bg-white border border-slate-200 shadow-slate-200/50'
              }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${d ? 'bg-red-500/15 border border-red-500/20' : 'bg-red-50 border border-red-100'
                }`}>
                <svg className={`w-6 h-6 ${d ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${d ? 'text-white' : 'text-slate-900'}`}>Delete this post?</h3>
              <p className={`text-sm mb-6 ${d ? 'text-slate-400' : 'text-slate-500'}`}>This action cannot be undone. All comments will also be removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${d ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    if (onDelete) await onDelete(alert.id);
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AlertCard;
