import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface ProfilePageProps {
  user: User;
  isOwnProfile?: boolean;
  onUpdate?: (updatedUser: User) => void;
  onBack: () => void;
  onMessage?: (userId: string, userName: string) => void;
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

const ProfilePage: React.FC<ProfilePageProps> = ({ user, isOwnProfile = false, onUpdate, onBack, onMessage }) => {
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
              // We just fire and forget this upsert to ensure the public table exists
              // using the data we have from Auth (which is passed in via props.user)
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

  // Determine what skills to display
  // If editing: show dynamic preview from input
  // If viewing: show static array from user prop
  const visibleSkills = isOwnProfile 
    ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : (user.skills || []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{isOwnProfile ? 'My Profile' : 'User Profile'}</h2>
            <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                Back
            </button>
        </div>

        <div className="p-6">
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <img 
                        src={processAvatarUrl(isOwnProfile ? avatar : user.avatar)} 
                        alt={name} 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-slate-100"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`;
                        }} 
                    />
                    {isOwnProfile && (
                        <button 
                            type="button"
                            onClick={generateRandomAvatar}
                            className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full shadow-md hover:bg-slate-700 transition-colors"
                            title="Generate Random Avatar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    )}
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900">{isOwnProfile ? name : user.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{isOwnProfile ? 'Manage your identity & skills' : 'Community Member'}</p>
                
                {/* Visual Skills Tags */}
                <div className="w-full mt-4">
                     {!isOwnProfile && (
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-2">
                            Skills & Capabilities
                        </h4>
                     )}
                     
                     {visibleSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                           {visibleSkills.map((skill, index) => (
                             <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm transition-transform hover:scale-105 cursor-default">
                               <svg className="w-3 h-3 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               {skill}
                             </span>
                           ))}
                        </div>
                     ) : (
                        !isOwnProfile && (
                           <div className="text-center py-4 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                               <p className="text-xs text-gray-400 italic">User has not listed any specific skills yet.</p>
                           </div>
                        )
                     )}
                </div>

                {/* Message Button for Other Users */}
                {!isOwnProfile && onMessage && (
                     <button
                        onClick={() => onMessage(user.id, user.name)}
                        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Send Message
                    </button>
                )}
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                   {message.text}
                </div>
            )}

            {isOwnProfile && (
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Avatar URL</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm"
                                placeholder="https://..."
                            />
                            <button 
                                type="button"
                                onClick={generateRandomAvatar}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm transition-colors"
                            >
                                Random
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Enter an image URL or a Google Drive sharing link.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Skills & Certifications</label>
                        <textarea 
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[120px]"
                            placeholder="E.g. CPR Certified, Mechanic, Fire Safety Training..."
                        />
                        <p className="text-xs text-gray-400 mt-2">Separate multiple skills with commas. These will be displayed as badges on your profile.</p>
                    </div>

                     <button
                        disabled={loading}
                        type="submit"
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            )}
        </div>
    </div>
  );
};

export default ProfilePage;