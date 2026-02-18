
import React, { useState, useEffect } from 'react';
import { EmergencyAlert, User, AlertComment } from '../types';
import { getFirstAidAdvice, findNearbyPlaces } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface AlertCardProps {
  alert: EmergencyAlert;
  onRespond: (alertId: string) => void;
  onMessage?: (userId: string, userName: string) => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User | null;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onRespond, onMessage, onViewProfile, currentUser }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<string | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  
  const [comments, setComments] = useState<AlertComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  const categoryColors: Record<string, string> = {
    Medical: 'bg-red-50 text-red-700 ring-red-600/10',
    Fire: 'bg-orange-50 text-orange-700 ring-orange-600/10',
    Security: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    Mechanical: 'bg-slate-50 text-slate-700 ring-slate-600/10',
    Other: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  };

  const severityBadge = (level: string) => {
    switch(level) {
      case 'Low': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">Easy Task</span>;
      case 'Medium': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100/50 text-blue-700 border border-blue-100 uppercase tracking-wide">Medium Task</span>;
      case 'High': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100/50 text-orange-700 border border-orange-100 uppercase tracking-wide">Hard Task</span>;
      default: return null;
    }
  };

  const isEmergency = alert.isEmergency !== false; 

  return (
    <div className={`group bg-white rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden ${
      isEmergency 
        ? 'shadow-lg shadow-red-100 border border-red-100' 
        : 'shadow-sm border border-slate-100 hover:border-slate-200'
    }`}>
      
      {/* Background Status Indicator */}
      {alert.status === 'responding' && (
        <div className="absolute -top-6 -right-6 p-4 bg-emerald-50 rounded-full opacity-50 blur-xl w-32 h-32 pointer-events-none"></div>
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
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            ) : alert.userName ? (
                 <img src={alert.userAvatar || `https://ui-avatars.com/api/?name=${alert.userName}`} alt={alert.userName} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:shadow-lg transition-all" />
            ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                    {alert.userName?.charAt(0) || '?'}
                </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-slate-900 text-lg leading-tight ${!isAnonymous && 'group-hover:text-red-600'} transition-colors`}>
                  {isAnonymous ? 'Anonymous' : alert.userName}
              </h3>
              {isEmergency && <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(alert.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} • {isEmergency ? <span className="text-red-600 font-bold">Emergency</span> : 'Request'}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${categoryColors[alert.category] || 'bg-gray-100 text-gray-700'}`}>
            {alert.category}
          </span>
          {!isEmergency && severityBadge(alert.severity)}
        </div>
      </div>

      <div className="mb-5 pl-2">
        <p className={`text-slate-700 text-sm leading-relaxed p-4 rounded-2xl ${isEmergency ? 'bg-red-50/50 border border-red-100/50' : 'bg-slate-50 border border-slate-100'}`}>
          {alert.description}
        </p>
      </div>

      {advice && (
        <div className="mb-5 p-5 bg-blue-50/80 border border-blue-100 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            AI Safety Advice
          </h4>
          <div className="text-blue-800/90 whitespace-pre-line prose prose-sm prose-blue">
            {advice}
          </div>
        </div>
      )}

      {nearbyPlaces && (
        <div className="mb-5 p-5 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
           <h4 className="font-bold text-emerald-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Nearby Help Locations
          </h4>
          <div className="text-emerald-800/90 whitespace-pre-line">
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
            className="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 hover:shadow-md transition-all border border-blue-100"
          >
            {loadingAdvice ? 'Processing...' : 'Ask AI Advice'}
          </button>
        )}

        {!nearbyPlaces && (
           <button
             onClick={fetchNearbyHelp}
             disabled={loadingPlaces}
             className="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 hover:shadow-md transition-all border border-emerald-100"
           >
             {loadingPlaces ? 'Searching...' : 'Find Places'}
           </button>
        )}
        
        {!isCurrentUser && (
            <>
                {onMessage && !isAnonymous && (
                    <button
                        onClick={() => onMessage(alert.userId, alert.userName)}
                        className="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 hover:shadow-md transition-all border border-indigo-100 flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Message
                    </button>
                )}

                {alert.status !== 'responding' && (
                <button
                    onClick={() => onRespond(alert.id)}
                    className={`flex-[2] min-w-[120px] py-2.5 px-6 rounded-xl text-white text-xs font-bold shadow-lg transform transition-all hover:scale-105 active:scale-95 ${
                        isEmergency 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30' 
                        : 'bg-gradient-to-r from-slate-900 to-slate-800 shadow-slate-900/20'
                    }`}
                >
                    {isEmergency ? 'RESPOND NOW' : 'Offer Help'}
                </button>
                )}
            </>
        )}
        
        {alert.status === 'responding' && (
          <div className="flex-[2] py-2.5 px-4 rounded-xl bg-emerald-50/80 text-emerald-700 text-xs font-bold border border-emerald-100 flex items-center justify-center gap-1.5 backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Help on the way
          </div>
        )}
      </div>

      {/* Comments Toggle */}
      <div className="mt-5 pt-3 border-t border-slate-100/80 pl-2">
        <button 
            onClick={() => setShowComments(!showComments)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors group/comments"
        >
            <svg className="w-4 h-4 text-slate-400 group-hover/comments:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            {comments.length} Comments
            {showComments 
              ? <svg className="w-3 h-3 ml-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg> 
              : <svg className="w-3 h-3 ml-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            }
        </button>

        {showComments && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-1">
                {/* Comment List */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-1">No comments yet. Start the discussion.</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <img 
                                    src={comment.userAvatar} 
                                    alt={comment.userName} 
                                    className="w-8 h-8 rounded-full border border-slate-100 mt-1 cursor-pointer object-cover shadow-sm"
                                    onClick={() => onViewProfile && onViewProfile(comment.userId)}
                                />
                                <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-3 text-xs border border-slate-100/50">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span 
                                            className="font-bold text-slate-800 cursor-pointer hover:text-red-600 transition-colors"
                                            onClick={() => onViewProfile && onViewProfile(comment.userId)}
                                        >
                                            {comment.userName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{comment.text}</p>
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
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={!newComment.trim() || loadingComments}
                        className="bg-slate-900 text-white rounded-xl px-4 py-1 text-xs font-bold hover:bg-slate-800 shadow-md shadow-slate-900/10 disabled:opacity-50 transition-all"
                    >
                        Post
                    </button>
                </form>
            </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-2">
        <div className="flex items-center">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Location Shared
        </div>
        <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {alert.responders.length} Responding
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
