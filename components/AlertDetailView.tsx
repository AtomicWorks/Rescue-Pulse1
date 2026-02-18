import React from 'react';
import { EmergencyAlert, User } from '../types';
import AlertCard from './AlertCard';
import CommentSection from './CommentSection';
import { useTheme } from './ThemeContext';

interface AlertDetailViewProps {
    alert: EmergencyAlert;
    currentUser: User | null;
    onBack: () => void;
    onVote: (alertId: string, type: 'up' | 'down') => void;
    onRespond: (alertId: string) => void;
    onDelete?: (alertId: string) => void;
    onMessage?: (userId: string, userName: string, userAvatar?: string) => void;
    onViewProfile?: (userId: string) => void;
}

const AlertDetailView: React.FC<AlertDetailViewProps> = ({
    alert, currentUser, onBack, onVote, onRespond, onDelete, onMessage, onViewProfile
}) => {
    const { isDark } = useTheme();
    const d = isDark;

    return (
        <div className={`flex flex-col h-full overflow-y-auto pb-20`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 p-4 border-b flex items-center gap-3 backdrop-blur-md ${d ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-100'}`}>
                <button onClick={onBack} className={`p-2 rounded-full transition-colors ${d ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                    <svg className={`w-5 h-5 ${d ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className={`font-bold text-lg ${d ? 'text-white' : 'text-slate-900'}`}>Thread</h2>
            </div>

            <div className="p-4 max-w-2xl mx-auto w-full">
                {/* The Alert Itself */}
                <AlertCard
                    alert={alert}
                    currentUser={currentUser}
                    onRespond={onRespond}
                    onDelete={onDelete}
                    onVote={onVote}
                    onMessage={onMessage}
                    onViewProfile={onViewProfile}
                // We don't pass onComments here to avoid recursive navigation button or just keep it?
                // If we don't pass it, the button won't render (good).
                // But we might want to show the comment count.
                // AlertCard renders button only if onComments is defined.
                // If we want to show count but no action, we might need to modify AlertCard props logic.
                // For now, let's NOT pass onComments, so the button is hidden in detail view.
                // This creates a clean "Post" look.
                />

                {/* Comment Section */}
                <div className={`mt-6 ${d ? 'text-slate-300' : 'text-slate-600'}`}>
                    <CommentSection
                        alertId={alert.id}
                        alertOwnerId={alert.userId}
                        currentUser={currentUser}
                    />
                </div>
            </div>
        </div>
    );
};

export default AlertDetailView;
