import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';
import ActivityList from './ActivityList';

interface ProfilePageProps {
    user: User;
    isOwnProfile?: boolean;
    onUpdate?: (updatedUser: User) => void;
    onBack: () => void;
    onMessage?: (userId: string, userName: string, userAvatar?: string) => void;
    onViewAlert?: (alertId: string) => void;
}

// Helper to convert Google Drive sharing links to direct image URLs
const processAvatarUrl = (url: string) => {
    if (!url) return '';

    // Check if it's a Google Drive link
    if (url.includes('drive.google.com')) {
        // Regex to extract the file ID from common Drive URL formats
        // Matches: /file/d/ID/view, open?id=ID, etc.
        const match = url.match(/(?:file\/d\/|id=|open\?id=)([-\w]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    return url;
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, isOwnProfile = false, onUpdate, onBack, onMessage, onViewAlert }) => {
    const { isDark } = useTheme();
    const d = isDark;
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    const [skillsInput, setSkillsInput] = useState(user.skills?.join(', ') || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Sync state if user prop changes (e.g. viewing different profiles)
    useEffect(() => {
        setName(user.name);
        setAvatar(user.avatar);
        setSkillsInput(user.skills?.join(', ') || '');
        setMessage(null);
    }, [user]);

    // Self-healing: If it's own profile, ensure public profile table is synced with auth metadata
    useEffect(() => {
        if (isOwnProfile && user) {
            const syncProfile = async () => {
                const { error } = await supabase.from('profiles').upsert({
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    skills: user.skills || []
                });
                if (error) console.error("Auto-sync profile error:", error);
            };
            syncProfile();
        }
    }, [isOwnProfile, user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwnProfile || !onUpdate) return;

        setLoading(true);
        setMessage(null);

        // Parse skills from input string
        const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const finalAvatarUrl = processAvatarUrl(avatar);

        try {
            // 1. Update Auth Metadata
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    name,
                    avatar: finalAvatarUrl,
                    skills: skillsArray
                }
            });

            if (error) throw error;

            // 2. Update Public Profiles Table (so others can see it)
            const profileUpdate = await supabase.from('profiles').upsert({
                id: user.id,
                name: name,
                avatar: finalAvatarUrl,
                skills: skillsArray
            });

            if (profileUpdate.error) {
                console.error("Profile table update failed:", profileUpdate.error);
            }

            if (data.user) {
                const updatedUser: User = {
                    ...user,
                    name: data.user.user_metadata.name,
                    avatar: data.user.user_metadata.avatar,
                    skills: skillsArray // Use the array we just created
                };

                // 3. Propagate changes to all related content tables
                await Promise.all([
                    supabase.from('alerts').update({ user_name: name, user_avatar: finalAvatarUrl }).eq('user_id', user.id),
                    supabase.from('comments').update({ user_name: name, user_avatar: finalAvatarUrl }).eq('user_id', user.id),
                    supabase.from('messages').update({ sender_name: name, sender_avatar: finalAvatarUrl }).eq('sender_id', user.id)
                ]);

                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                setAvatar(finalAvatarUrl);
                onUpdate(updatedUser);
            }
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const generateRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        setAvatar(`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`);
    };

    const visibleSkills = isOwnProfile
        ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : (user.skills || []);

    const inputClass = d
        ? 'bg-white/5 border-white/10 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400';

    return (
        <div className={`rounded-2xl shadow-lg overflow-hidden theme-transition ${d ? 'glass-light shadow-black/20' : 'bg-white shadow-slate-200/50 border border-slate-100'
            }`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex justify-between items-center ${d ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
                }`}>
                <h2 className={`text-xl font-bold ${d ? 'text-white' : 'text-slate-900'}`}>{isOwnProfile ? 'My Profile' : 'User Profile'}</h2>
                <button onClick={onBack} className={`text-sm font-semibold transition-colors ${d ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
                    Back
                </button>
            </div>

            <div className="p-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <img
                            src={processAvatarUrl(isOwnProfile ? avatar : user.avatar)}
                            alt={name}
                            className={`w-24 h-24 rounded-full border-4 shadow-lg object-cover ${d ? 'border-white/10 bg-white/5' : 'border-white bg-slate-50'}`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`;
                            }}
                        />
                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={generateRandomAvatar}
                                className={`absolute bottom-0 right-0 text-white p-2 rounded-full shadow-md transition-all ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-cyan-500/20' : 'bg-slate-900 hover:bg-slate-800'
                                    }`}
                                title="Generate Random Avatar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        )}
                    </div>
                    <h3 className={`mt-3 text-lg font-bold ${d ? 'text-white' : 'text-slate-900'}`}>{isOwnProfile ? name : user.name}</h3>
                    <p className={`text-xs mb-3 ${d ? 'text-slate-500' : 'text-slate-400'}`}>{isOwnProfile ? 'Manage your identity & skills' : 'Community Member'}</p>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-full max-w-xs">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'details'
                                ? (d ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                                : (d ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')
                                }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'activity'
                                ? (d ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                                : (d ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')
                                }`}
                        >
                            History
                        </button>
                    </div>

                    {activeTab === 'activity' ? (
                        <div className="w-full mt-6 text-left">
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                                Recent Activity
                            </h4>
                            {onViewAlert && <ActivityList userId={user.id} onViewAlert={onViewAlert} />}
                        </div>
                    ) : (
                        <>
                            {/* Visual Skills Tags */}
                            <div className="w-full mt-4">
                                {!isOwnProfile && (
                                    <h4 className={`text-xs font-bold uppercase tracking-wider text-center mb-2 ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Skills & Capabilities
                                    </h4>
                                )}

                                {visibleSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                                        {visibleSkills.map((skill, index) => (
                                            <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-transform hover:scale-105 cursor-default ${d ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                <svg className={`w-3 h-3 mr-1.5 ${d ? 'text-cyan-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    !isOwnProfile && (
                                        <div className={`text-center py-4 px-6 rounded-xl border border-dashed ${d ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                                            }`}>
                                            <p className={`text-xs italic ${d ? 'text-slate-500' : 'text-slate-400'}`}>User has not listed any specific skills yet.</p>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Message Button for Other Users */}
                            {!isOwnProfile && onMessage && (
                                <button
                                    onClick={() => onMessage(user.id, user.name, user.avatar)}
                                    className={`mt-6 px-6 py-2 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 shadow-cyan-500/20 hover:shadow-cyan-500/30' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'
                                        }`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    Send Message
                                </button>
                            )}

                            {message && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center ${message.type === 'success'
                                    ? (d ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')
                                    : (d ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100')
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            {isOwnProfile && (
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div>
                                        <label className={`block text-sm font-bold mb-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Display Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 ${inputClass}`}
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-bold mb-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Avatar URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={avatar}
                                                onChange={(e) => setAvatar(e.target.value)}
                                                className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all text-sm focus:ring-2 ${inputClass}`}
                                                placeholder="https://..."
                                            />
                                            <button
                                                type="button"
                                                onClick={generateRandomAvatar}
                                                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-colors border ${d ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                            >
                                                Random
                                            </button>
                                        </div>
                                        <p className={`text-[10px] mt-2 ${d ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Enter an image URL or a Google Drive sharing link.
                                        </p>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-bold mb-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Skills & Certifications</label>
                                        <textarea
                                            value={skillsInput}
                                            onChange={(e) => setSkillsInput(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all min-h-[120px] focus:ring-2 ${inputClass}`}
                                            placeholder="E.g. CPR Certified, Mechanic, Fire Safety Training..."
                                        />
                                        <p className={`text-xs mt-2 ${d ? 'text-slate-500' : 'text-slate-400'}`}>Separate multiple skills with commas. These will be displayed as badges on your profile.</p>
                                    </div>

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className={`w-full py-4 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 shadow-cyan-500/20 hover:shadow-cyan-500/30' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'
                                            }`}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;