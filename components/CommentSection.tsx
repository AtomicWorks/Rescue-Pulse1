import React, { useEffect, useState } from 'react';
import { User, AlertComment } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';

interface CommentSectionProps {
    alertId: string;
    alertOwnerId: string;
    currentUser: User | null;
}

// Convert DB comment to App Type
const mapComment = (c: any): AlertComment => ({
    id: c.id,
    alertId: c.alert_id,
    userId: c.user_id,
    userName: c.user_name,
    userAvatar: c.user_avatar,
    text: c.text,
    createdAt: c.created_at
});

const CommentSection: React.FC<CommentSectionProps> = ({ alertId, alertOwnerId, currentUser }) => {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const d = isDark;
    const [comments, setComments] = useState<AlertComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('alert_id', alertId)
                .order('created_at', { ascending: true });

            if (error) console.error("Error fetching comments:", error);
            if (data) {
                setComments(data.map(mapComment));
            }
            setLoading(false);
        };

        fetchComments();

        const channel = supabase
            .channel(`comments_${alertId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events
                    schema: 'public',
                    table: 'comments',
                    filter: `alert_id=eq.${alertId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setComments(prev => [...prev, mapComment(payload.new)]);
                    } else if (payload.eventType === 'DELETE') {
                        setComments(prev => prev.filter(c => c.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        // Handle update if we add edit feature
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [alertId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newComment.trim()) return;

        const text = newComment.trim();
        setNewComment('');

        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticComment: AlertComment = {
            id: tempId,
            alertId,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            text,
            createdAt: new Date().toISOString()
        };
        setComments(prev => [...prev, optimisticComment]);

        const { data, error } = await supabase.from('comments').insert([{
            alert_id: alertId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            text
        }]).select().single();

        if (error) {
            console.error("Error adding comment:", error);
            setComments(prev => prev.filter(c => c.id !== tempId)); // Revert
        } else if (data) {
            // Replace optimistic with real
            setComments(prev => prev.map(c => c.id === tempId ? mapComment(data) : c));
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        // Optimistic delete
        const prevComments = [...comments];
        setComments(prev => prev.filter(c => c.id !== commentId));

        const { error } = await supabase.from('comments').delete().eq('id', commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            setComments(prevComments); // Revert
        }
    };

    return (
        <div className={`mt-4 pt-4 border-t ${d ? 'border-white/10' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${d ? 'text-white' : 'text-slate-800'}`}>{t('alert.actions.comments')}</h3>

            <div className="space-y-4 mb-4">
                {loading ? (
                    <div className={`text-center text-xs ${d ? 'text-slate-500' : 'text-slate-400'}`}>{t('alert.comments.loading')}</div>
                ) : comments.length === 0 ? (
                    <div className={`text-center py-4 text-xs ${d ? 'text-slate-500' : 'text-slate-400'}`}>{t('alert.comments.emptyShare')}</div>
                ) : (
                    comments.map(comment => {
                        const isOwner = currentUser && (currentUser.id === comment.userId || currentUser.id === alertOwnerId);
                        const canDelete = isOwner;

                        return (
                            <div key={comment.id} className="flex gap-3 group">
                                <div className="flex-shrink-0">
                                    {comment.userAvatar ? (
                                        <img src={comment.userAvatar} className="w-8 h-8 rounded-full" alt={comment.userName} />
                                    ) : (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${d ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                            {comment.userName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`rounded-xl px-3 py-2 ${d ? 'bg-white/5' : 'bg-slate-50'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold ${d ? 'text-slate-200' : 'text-slate-700'}`}>{comment.userName}</span>
                                            <span className={`text-[10px] ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${d ? 'text-slate-300' : 'text-slate-600'}`}>{comment.text}</p>
                                    </div>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-[10px] text-red-500 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {currentUser && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        // Wait, I used 'setNewComment' in definition but 'setNewMessage' here?
                        // Need to fix.
                        // Actually, in the code content I wrote `onChange={(e) => setNewComment(e.target.value)}`.
                        // Ah, looking at the block above, I wrote `const [newComment, setNewComment] = useState('');`
                        placeholder={t('alert.comments.placeholder')}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all ${d ? 'bg-white/5 border border-white/10 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
                            : 'bg-white border border-slate-200 focus:border-cyan-500 text-slate-800 placeholder:text-slate-400'
                            }`}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all ${d ? 'bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50'
                            : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50'
                            }`}
                    >
                        {t('common.post')}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CommentSection;
