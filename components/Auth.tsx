
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { useTheme } from './ThemeContext';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { isDark, toggleTheme } = useTheme();
  const d = isDark;
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skills: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (data.user) {
          const metadata = data.user.user_metadata || {};

          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: metadata.name || data.user.email?.split('@')[0] || 'User',
            avatar: metadata.avatar,
            skills: metadata.skills || []
          });

          const user: User = {
            id: data.user.id,
            name: metadata.name || data.user.email?.split('@')[0] || 'User',
            avatar: metadata.avatar || `https://picsum.photos/seed/${data.user.id}/100/100`,
            skills: metadata.skills || []
          };
          onLogin(user);
        }

      } else {
        const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
        const avatarUrl = `https://picsum.photos/seed/${formData.email}/100/100`;

        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              avatar: avatarUrl,
              skills: skillsArray
            }
          }
        });

        if (authError) throw authError;

        if (data.user) {
          setIsLogin(true);

          if (data.session) {
            setSuccess("Account created successfully! Please sign in.");
          } else {
            setSuccess("Account created! Please check your email inbox to verify your account before logging in.");
          }
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let errorMessage = err.message || 'An unexpected error occurred';

      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid login credentials. Please check your details.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  const inputClass = d
    ? 'bg-white/5 border-white/10 focus:bg-white/10 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
    : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden theme-transition" style={{ background: d ? '#0A0E1A' : '#f8fafc' }}>
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {d ? (
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] animate-ambient" />
            <div className="absolute top-[30%] right-[-5%] w-[40%] h-[40%] bg-red-600/15 rounded-full blur-[120px] animate-ambient" style={{ animationDelay: '3s' }} />
            <div className="absolute -bottom-[15%] left-[20%] w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[120px] animate-ambient" style={{ animationDelay: '6s' }} />
          </>
        ) : (
          <>
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px]" />
            <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-red-200/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px]" />
          </>
        )}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          {/* Theme toggle on auth screen */}
          <button
            onClick={toggleTheme}
            className={`absolute top-0 right-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors ${d ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
            title={d ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {d ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-xl shadow-red-500/30 mb-4 animate-bounce">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${d ? 'text-white' : 'text-slate-900'}`}>RescuePulse</h1>
          <p className={`mt-2 text-lg ${d ? 'text-slate-400' : 'text-slate-500'}`}>Community Response Network</p>
        </div>

        <div className={`rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 ${d ? 'glass-light shadow-black/30' : 'bg-white/80 backdrop-blur-xl border border-white/50'
          }`}>
          <div className="p-8 sm:p-10">
            <h2 className={`text-2xl font-bold mb-6 text-center ${d ? 'text-white' : 'text-slate-900'}`}>
              {isLogin ? 'Welcome Back' : 'Join the Network'}
            </h2>

            {error && (
              <div className={`mb-6 p-4 text-sm font-medium rounded-xl flex items-start gap-2 ${d ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {success && (
              <div className={`mb-6 p-4 text-sm font-medium rounded-xl flex items-start gap-2 ${d ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ml-1 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-xl border transition-all outline-none font-medium focus:ring-2 ${inputClass}`}
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ml-1 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-5 py-3.5 rounded-xl border transition-all outline-none font-medium focus:ring-2 ${inputClass}`}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ml-1 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-5 py-3.5 rounded-xl border transition-all outline-none font-medium focus:ring-2 ${inputClass}`}
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ml-1 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Helpful Skills <span className={`font-normal ${d ? 'text-slate-500' : 'text-slate-400'}`}>(Optional)</span></label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-xl border transition-all outline-none font-medium focus:ring-2 ${inputClass}`}
                    placeholder="First Aid, CPR, Mechanical..."
                  />
                </div>
              )}

              <button
                disabled={isLoading}
                type="submit"
                className={`w-full py-4 text-white rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/25'
                    : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25'
                  }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          </div>

          <div className={`p-6 text-center border-t ${d ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
            <p className={`text-sm font-medium ${d ? 'text-slate-400' : 'text-slate-500'}`}>
              {isLogin ? "New here?" : "Already a member?"}{' '}
              <button
                onClick={toggleMode}
                className={`font-bold transition-colors ${d ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-900 hover:text-red-600'}`}
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
