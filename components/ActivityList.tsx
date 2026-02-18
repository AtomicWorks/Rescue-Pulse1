import React, { useEffect, useState } from 'react';
import { UserActivity } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';

interface ActivityListProps {
    userId: string;
    onViewAlert: (alertId: string) => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ userId, onViewAlert }) => {
    const { isDark } = useTheme();
    const { t, language } = useLanguage();
    const d = isDark;
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) console.error("Error fetching activities:", error);
            if (data) setActivities(data as UserActivity[]);
            setLoading(false);
        };

        fetchActivities();
    }, [userId]);

    const renderIcon = (type: string) => {
        switch (type) {
            case 'created_alert':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
            case 'commented':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
            case 'upvoted':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
            default:
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        }
    };

    return (
        <div className="space-y-3">
            {loading ? (
                <div className={`text-center py-8 text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>{t('profile.activity.loading')}</div>
            ) : activities.length === 0 ? (
                <div className={`text-center py-8 text-sm ${d ? 'text-slate-500' : 'text-slate-400'}`}>{t('profile.activity.empty')}</div>
            ) : (
                activities.map(activity => (
                    <div
                        key={activity.id}
                        onClick={() => onViewAlert(activity.alert_id)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3 ${d ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${activity.type === 'created_alert' ? (d ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500') :
                            activity.type === 'commented' ? (d ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-500') :
                                activity.type === 'upvoted' ? (d ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500') :
                                    'bg-slate-100 text-slate-500'
                            }`}>
                            {renderIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className={`text-sm font-medium ${d ? 'text-white' : 'text-slate-900'}`}>
                                    {activity.type === 'created_alert' && t('profile.activity.postedAlert')}
                                    {activity.type === 'commented' && t('profile.activity.commented')}
                                    {activity.type === 'upvoted' && t('profile.activity.upvoted')}
                                </p>
                                <span className={`text-[10px] ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {new Date(activity.created_at).toLocaleDateString(language)}
                                </span>
                            </div>
                            {activity.metadata && (activity.metadata.title || activity.metadata.text) && (
                                <p className={`text-xs mt-1 truncate ${d ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {activity.metadata.title || `"${activity.metadata.text}"`}
                                </p>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ActivityList;
