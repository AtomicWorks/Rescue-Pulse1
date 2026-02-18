
import React, { useState, useEffect, useCallback } from 'react';
import EmergencyButton from './components/EmergencyButton';
import AlertCard from './components/AlertCard';
import MapView from './components/MapView';
import CreatePostModal from './components/CreatePostModal';
import Auth from './components/Auth';
import ProfilePage from './components/ProfilePage';
import ChatList from './components/ChatList';
import ChatView from './components/ChatView';
import AIChatBot from './components/AIChatBot';
import { EmergencyAlert, User, Location, HelpCategory, SeverityLevel } from './types';
import { supabase } from '../services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [view, setView] = useState<'feed' | 'map' | 'profile' | 'user_profile' | 'messages' | 'my_requests'>('feed');
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [dbError, setDbError] = useState<boolean>(false);
  
  // Chat State
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  // Profile Viewing State
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Retrieve profile data directly from User Metadata
        const metadata = session.user.user_metadata || {};
        const userData = {
             id: session.user.id,
             name: metadata.name || session.user.email?.split('@')[0] || 'User',
             avatar: metadata.avatar || `https://picsum.photos/seed/${session.user.id}/100/100`,
             skills: metadata.skills || []
        };
        setUser(userData);

        // AUTO-SYNC: Ensure public profile table matches auth metadata on load
        supabase.from('profiles').upsert({
            id: userData.id,
            name: userData.name,
            avatar: userData.avatar,
            skills: userData.skills
        }).then(({ error }) => {
            if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
                 // Table missing, handled by dbError check later
            } else if (error) {
                 console.error("Background profile sync failed:", error);
            }
        });
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Track User Location in Real-time
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    const success = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationError(null);
    };

    const error = () => {
      setLocationError("Unable to retrieve your location. Please enable location services.");
    };

    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });

    const watchId = navigator.geolocation.watchPosition(success, error, { 
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchAlerts = useCallback(async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .neq('status', 'resolved') // Fetch active and responding
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching alerts:", error.message);
        if (
            error.message.includes('does not exist') || 
            error.code === '42P01' || 
            error.message.includes('Could not find the table')
        ) {
            setDbError(true);
        }
        return;
      }

      if (data) {
        const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
        if (profileError && (profileError.code === '42P01' || profileError.message.includes('does not exist'))) {
            setDbError(true);
            return;
        }

        setDbError(false);
        const mappedAlerts: EmergencyAlert[] = data.map(a => ({
          id: a.id,
          userId: a.user_id,
          userName: a.user_name,
          userAvatar: a.user_avatar,
          category: a.category,
          description: a.description,
          location: { lat: a.lat, lng: a.lng },
          timestamp: new Date(a.created_at).getTime(),
          status: a.status,
          responders: a.responders || [],
          severity: a.severity || 'Medium',
          isEmergency: a.is_emergency !== false, 
          isAnonymous: a.is_anonymous === true
        }));
        setAlerts(mappedAlerts);

        if (user) {
            const myActive = mappedAlerts.find(a => a.userId === user.id && a.status === 'active' && a.isEmergency);
            if (myActive) setActiveAlert(myActive);
        }
      }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchAlerts();

    const channel = supabase
      .channel('alerts_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new;
            setAlerts(prev => {
                if (prev.some(a => a.id === newAlert.id)) return prev;
                
                const mappedAlert: EmergencyAlert = {
                  id: newAlert.id,
                  userId: newAlert.user_id,
                  userName: newAlert.user_name,
                  userAvatar: newAlert.user_avatar,
                  category: newAlert.category,
                  description: newAlert.description,
                  location: { lat: newAlert.lat, lng: newAlert.lng },
                  timestamp: new Date(newAlert.created_at).getTime(),
                  status: newAlert.status,
                  responders: newAlert.responders || [],
                  severity: newAlert.severity || 'Medium',
                  isEmergency: newAlert.is_emergency !== false,
                  isAnonymous: newAlert.is_anonymous === true
                };

                if (mappedAlert.userId === user.id && mappedAlert.isEmergency) {
                   setActiveAlert(mappedAlert);
                }
                
                return [mappedAlert, ...prev];
            });
            
          } else if (payload.eventType === 'UPDATE') {
             const updated = payload.new;
             setAlerts(prev => prev.map(a => {
               if (a.id === updated.id) {
                 return {
                   ...a,
                   userName: updated.user_name,
                   userAvatar: updated.user_avatar,
                   status: updated.status,
                   responders: updated.responders || [],
                   severity: updated.severity,
                   isEmergency: updated.is_emergency !== false,
                   isAnonymous: updated.is_anonymous === true
                 };
               }
               return a;
             }).filter(a => a.status !== 'resolved'));

             if (updated.user_id === user.id && updated.status === 'resolved') {
               setActiveAlert(null);
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  useEffect(() => {
    if (!dbError) return;

    const interval = setInterval(async () => {
       const { error: alertError } = await supabase.from('alerts').select('id').limit(1);
       const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
       
       const isAlertsMissing = alertError && (alertError.code === '42P01' || alertError.message.includes('does not exist'));
       const isProfilesMissing = profileError && (profileError.code === '42P01' || profileError.message.includes('does not exist'));

       if (!isAlertsMissing && !isProfilesMissing) {
           setDbError(false);
           if (user) fetchAlerts();
       }
    }, 3000);

    return () => clearInterval(interval);
  }, [dbError, user, fetchAlerts]);


  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveAlert(null);
    setAlerts([]);
    setView('feed');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setAlerts(prev => prev.map(a => 
      a.userId === updatedUser.id 
        ? { ...a, userName: updatedUser.name, userAvatar: updatedUser.avatar }
        : a
    ));
  };

  const handleStartChat = (userId: string, userName: string) => {
    if (!user) return;
    setChatPartner({ id: userId, name: userName });
    setView('messages');
  };

  const handleSelectChat = (partner: { id: string; name: string; avatar?: string }) => {
    setChatPartner(partner);
    setView('messages'); 
  };

  const handleViewProfile = async (userId: string) => {
    if (!user) return;
    if (userId === user.id) {
        setView('profile');
        return;
    }

    setViewingUser(null); 

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (data) {
        setViewingUser({
            id: data.id,
            name: data.name,
            avatar: data.avatar,
            skills: data.skills || []
        });
        setView('user_profile');
    } else {
        const { data: alertData } = await supabase
            .from('alerts')
            .select('user_name, user_avatar')
            .eq('user_id', userId)
            .limit(1)
            .single();
        
        if (alertData) {
             setViewingUser({
                id: userId,
                name: alertData.user_name,
                avatar: alertData.user_avatar || `https://ui-avatars.com/api/?name=${alertData.user_name}`,
                skills: [] 
             });
             setView('user_profile');
        } else {
             const { data: commentData } = await supabase
                .from('comments')
                .select('user_name, user_avatar')
                .eq('user_id', userId)
                .limit(1)
                .single();
             
             if (commentData) {
                 setViewingUser({
                    id: userId,
                    name: commentData.user_name,
                    avatar: commentData.user_avatar || `https://ui-avatars.com/api/?name=${commentData.user_name}`,
                    skills: []
                 });
                 setView('user_profile');
             } else {
                 console.error("Could not find user details.");
             }
        }
    }
  };

  const broadcastAlertOrPost = async (
    category: HelpCategory, 
    description: string, 
    isEmergency: boolean, 
    severity: SeverityLevel,
    isAnonymous: boolean = false
  ) => {
    if (!user) return;
    const lat = userLocation?.lat || 0;
    const lng = userLocation?.lng || 0;

    const nameToUse = isAnonymous ? 'Anonymous' : user.name;
    const avatarToUse = isAnonymous ? 'https://ui-avatars.com/api/?name=Anonymous&background=64748b&color=fff' : user.avatar;

    const performInsert = async (latitude: number, longitude: number) => {
        const { data, error } = await supabase.from('alerts').insert([{
            user_id: user.id,
            user_name: nameToUse,
            user_avatar: avatarToUse,
            category: category,
            description: description,
            lat: latitude,
            lng: longitude,
            status: 'active',
            responders: [],
            is_emergency: isEmergency,
            severity: severity,
            is_anonymous: isAnonymous
          }]).select();
    
          if (error) {
            console.error("Error posting:", error);
            if (
                error.message.includes('does not exist') || 
                error.code === '42P01' || 
                error.message.includes('Could not find the table')
            ) {
                 setDbError(true);
            } else {
                 alert("Failed to broadcast alert. Check console for details.");
            }
          } else if (data && data.length > 0) {
             const newAlertRaw = data[0];
             const newAlert: EmergencyAlert = {
                id: newAlertRaw.id,
                userId: newAlertRaw.user_id,
                userName: newAlertRaw.user_name,
                userAvatar: newAlertRaw.user_avatar,
                category: newAlertRaw.category,
                description: newAlertRaw.description,
                location: { lat: newAlertRaw.lat, lng: newAlertRaw.lng },
                timestamp: new Date(newAlertRaw.created_at).getTime(),
                status: newAlertRaw.status,
                responders: newAlertRaw.responders || [],
                severity: newAlertRaw.severity || 'Medium',
                isEmergency: newAlertRaw.is_emergency !== false,
                isAnonymous: newAlertRaw.is_anonymous === true
             };

             setAlerts(prev => [newAlert, ...prev]);
             if (isEmergency) setActiveAlert(newAlert);
          }
    };

    if (userLocation) {
        performInsert(lat, lng);
    } else if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => performInsert(pos.coords.latitude, pos.coords.longitude),
            (err) => {
              console.warn("Geolocation failed", err);
              performInsert(0, 0);
            }
        );
    } else {
        performInsert(0, 0);
    }
  };

  const handleTriggerHelp = useCallback(async (category: string, description: string) => {
    await broadcastAlertOrPost(category as HelpCategory, description, true, 'High', false);
  }, [user, userLocation]);

  const handleCreatePost = useCallback(async (category: HelpCategory, description: string, severity: SeverityLevel, isAnonymous: boolean) => {
    await broadcastAlertOrPost(category, description, false, severity, isAnonymous);
  }, [user, userLocation]);

  const handleRespond = async (alertId: string) => {
    if (!user) return;
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const updatedResponders = [...alert.responders, user.id];
    
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { ...a, status: 'responding', responders: updatedResponders } 
        : a
    ));

    const { error } = await supabase
      .from('alerts')
      .update({ 
        status: 'responding',
        responders: updatedResponders 
      })
      .eq('id', alertId);

    if (error) {
      console.error("Error responding:", error);
    }
  };

  const resolveAlert = async () => {
    if (activeAlert) {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'resolved' })
        .eq('id', activeAlert.id);
        
      if (!error) {
        setActiveAlert(null);
        setAlerts(prev => prev.filter(a => a.id !== activeAlert.id));
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading RescuePulse...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (dbError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
           {/* ... existing dbError UI ... */}
           {/* Keeping the DB error UI simple for brevity as it's an edge case */}
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border-2 border-red-100 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Setup Required</h1>
                <p className="text-gray-600 mb-4">Please check the main file for the SQL code.</p>
            </div>
        </div>
      );
  }

  const nearbyAlerts = alerts.filter(a => a.userId !== user?.id);
  const myAlerts = alerts.filter(a => a.userId === user?.id);
  
  const isHomeView = view === 'feed' || view === 'map' || view === 'my_requests';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col pb-24 sm:pb-0 font-sans">
      {/* Header - Glassmorphism */}
      <header className="fixed top-0 w-full z-40 px-4 py-4 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div onClick={() => setView('feed')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">RescuePulse</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div 
              onClick={() => { setView('messages'); setChatPartner(null); }} 
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100/80 cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>

            <div className="hidden sm:block text-right">
              <p 
                  onClick={() => setView('profile')}
                  className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-red-600 transition-colors"
              >
                  {user.name}
              </p>
              <button onClick={handleLogout} className="text-[10px] text-slate-400 hover:text-red-600 font-bold uppercase tracking-wider">Sign Out</button>
            </div>
            
            <div className="relative group">
              <img 
                  src={user.avatar} 
                  alt="Profile" 
                  onClick={() => setView('profile')}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:ring-2 hover:ring-red-100 transition-all object-cover" 
              />
              {/* Dropdown for Desktop */}
              <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block sm:group-hover:hidden z-50 transform origin-top-right transition-all">
                 <button onClick={() => setView('profile')} className="w-full text-left px-4 py-3 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">My Profile</button>
                 <button onClick={() => { setView('messages'); setChatPartner(null); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">Messages</button>
                 <div className="h-px bg-slate-100 my-1"></div>
                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        
        {locationError && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl text-sm border border-amber-200 shadow-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <p>Warning: {locationError}. Map features may be limited.</p>
          </div>
        )}

        {(view === 'feed' || view === 'map' || view === 'my_requests') && (
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Community Feed</h2>
              <button 
                  onClick={() => setIsPostModalOpen(true)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Request Help
              </button>
            </div>
        )}

        {activeAlert && view !== 'messages' && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-3xl p-6 text-white shadow-xl shadow-red-500/30 animate-in fade-in zoom-in border border-red-400/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                        Alert Broadcasting!
                    </h2>
                    <p className="text-red-50 font-medium">Help is being requested from nearby community members.</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm uppercase tracking-wide border border-white/20">
                    Live Status
                </div>
                </div>
                <div className="flex space-x-3">
                <button 
                    onClick={resolveAlert}
                    className="flex-1 bg-white text-red-600 py-3.5 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-lg active:scale-[0.98]"
                >
                    I Am Safe Now
                </button>
                </div>
            </div>
          </div>
        )}

        {(view === 'feed' || view === 'map' || view === 'my_requests') && (
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full">
            <button 
                onClick={() => setView('feed')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${view === 'feed' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                Nearby
            </button>
            <button 
                onClick={() => setView('my_requests')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${view === 'my_requests' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                My Requests
            </button>
            <button 
                onClick={() => setView('map')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${view === 'map' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                Map
            </button>
            </div>
        )}

        {view === 'feed' && (
          <div className="grid grid-cols-1 gap-5">
            {nearbyAlerts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Quiet in the neighborhood</h3>
                <p className="text-slate-500 mt-1">No active requests nearby at the moment.</p>
              </div>
            ) : (
              nearbyAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onRespond={handleRespond}
                  onMessage={handleStartChat}
                  onViewProfile={handleViewProfile}
                  currentUser={user}
                />
              ))
            )}
          </div>
        )}

        {view === 'my_requests' && (
          <div className="grid grid-cols-1 gap-5">
            {myAlerts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">No active requests</h3>
                <p className="text-slate-500 mt-1">You haven't posted any help requests yet.</p>
              </div>
            ) : (
              myAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onRespond={handleRespond}
                  onMessage={handleStartChat}
                  onViewProfile={handleViewProfile}
                  currentUser={user}
                />
              ))
            )}
          </div>
        )}

        {view === 'map' && (
          <div className="bg-white rounded-3xl border border-slate-200 h-[600px] shadow-sm overflow-hidden relative z-0">
            <MapView 
              alerts={alerts} 
              userLocation={userLocation}
              onRespond={handleRespond}
            />
          </div>
        )}

        {view === 'profile' && (
            <ProfilePage 
                user={user} 
                isOwnProfile={true}
                onUpdate={handleUpdateUser} 
                onBack={() => setView('feed')} 
            />
        )}

        {view === 'user_profile' && viewingUser && (
            <ProfilePage 
                user={viewingUser} 
                isOwnProfile={false}
                onBack={() => setView('feed')}
                onMessage={(id, name) => {
                    handleStartChat(id, name);
                }}
            />
        )}

        {view === 'messages' && (
            chatPartner ? (
                <ChatView 
                    currentUser={user}
                    chatPartner={chatPartner}
                    onBack={() => setChatPartner(null)}
                />
            ) : (
                <ChatList 
                    currentUser={user}
                    onSelectUser={handleSelectChat}
                    onBack={() => setView('feed')}
                />
            )
        )}
      </main>

      {/* Floating Action Buttons */}
      {!activeAlert && isHomeView && <EmergencyButton onTrigger={handleTriggerHelp} />}
      {isHomeView && <AIChatBot />}
      
      <CreatePostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        onSubmit={handleCreatePost}
      />

      {/* Mobile Bottom Navigation - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe pt-3 px-6 flex justify-around sm:hidden z-40 transition-all">
        <button onClick={() => setView('feed')} className={`flex flex-col items-center space-y-1 transition-colors ${view === 'feed' || view === 'map' || view === 'my_requests' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setIsPostModalOpen(true)} className="flex flex-col items-center space-y-1 text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[10px] font-bold">Post</span>
        </button>
        <button onClick={() => { setView('messages'); setChatPartner(null); }} className={`flex flex-col items-center space-y-1 transition-colors ${view === 'messages' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-bold">Msg</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center space-y-1 transition-colors ${view === 'profile' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
           <img src={user.avatar} className={`w-6 h-6 rounded-full border-2 ${view === 'profile' ? 'border-red-600' : 'border-transparent'}`} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
