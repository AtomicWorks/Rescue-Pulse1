
import React, { useState } from 'react';
import { HelpCategory, SeverityLevel } from '../types';
import { useTheme } from './ThemeContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: HelpCategory, description: string, severity: SeverityLevel, isAnonymous: boolean) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { isDark } = useTheme();
  const d = isDark;
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HelpCategory>('Mechanical');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(category, description, severity, isAnonymous);
    setDescription('');
    setCategory('Mechanical');
    setSeverity('Medium');
    setIsAnonymous(false);
    onClose();
  };

  const categories: HelpCategory[] = ['Mechanical', 'Medical', 'Security', 'Other'];

  // Severity card styles
  const sevCard = (active: boolean, activeClass: string) =>
    active
      ? activeClass
      : (d ? 'border-white/10 hover:bg-white/5 hover:border-white/20' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className={`w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${d ? 'glass-light shadow-black/40' : 'bg-white shadow-slate-200/50'
        }`}>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${d ? 'text-white' : 'text-slate-900'}`}>Request Help</h2>
              <p className={`text-sm mt-1 ${d ? 'text-slate-400' : 'text-slate-500'}`}>Ask the community for assistance</p>
            </div>
            <button onClick={onClose} className={`p-2.5 rounded-full transition-colors ${d ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Category Selection */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
              <div className="flex flex-wrap gap-2.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${category === cat
                      ? (d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white border-transparent shadow-lg shadow-cyan-500/20 scale-105' : 'bg-slate-900 text-white border-transparent shadow-lg shadow-slate-900/20 scale-105')
                      : (d ? 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900')
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Effort/Severity Selection */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Effort Required</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSeverity('Low')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${sevCard(severity === 'Low', d
                    ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 shadow-md shadow-emerald-100')
                    }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'Low' ? (d ? 'text-emerald-400' : 'text-emerald-700') : (d ? 'text-slate-500' : 'text-slate-500')}`}>Easy</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'Low' ? (d ? 'text-emerald-400/80' : 'text-emerald-600') : (d ? 'text-slate-500/80' : 'text-slate-400')}`}>Quick Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('Medium')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${sevCard(severity === 'Medium', d
                    ? 'bg-blue-500/15 border-blue-500/50 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-md shadow-blue-100')
                    }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'Medium' ? (d ? 'text-blue-400' : 'text-blue-700') : (d ? 'text-slate-500' : 'text-slate-500')}`}>Medium</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'Medium' ? (d ? 'text-blue-400/80' : 'text-blue-600') : (d ? 'text-slate-500/80' : 'text-slate-400')}`}>Standard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('High')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${sevCard(severity === 'High', d
                    ? 'bg-orange-500/15 border-orange-500/50 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                    : 'bg-orange-50 border-orange-300 ring-1 ring-orange-200 shadow-md shadow-orange-100')
                    }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'High' ? (d ? 'text-orange-400' : 'text-orange-700') : (d ? 'text-slate-500' : 'text-slate-500')}`}>Hard</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'High' ? (d ? 'text-orange-400/80' : 'text-orange-600') : (d ? 'text-slate-500/80' : 'text-slate-400')}`}>Heavy</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${d ? 'text-slate-300' : 'text-slate-700'}`}>Details</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what you need help with..."
                className={`w-full px-5 py-4 rounded-2xl border min-h-[120px] text-sm resize-none font-medium transition-all outline-none focus:ring-2 ${d ? 'bg-white/5 border-white/10 focus:bg-white/10 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400'
                  }`}
              />
            </div>

            {/* Anonymous Toggle */}
            <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${d ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
              }`}>
              <div className="relative inline-block w-12 h-7 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="toggle"
                  id="toggle"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 top-1 transition-transform duration-300 checked:translate-x-6 shadow-sm ${d ? 'checked:border-cyan-500' : 'checked:border-slate-900'
                    }`}
                />
                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300 ${isAnonymous ? (d ? 'bg-cyan-600' : 'bg-slate-900') : (d ? 'bg-white/10' : 'bg-slate-200')
                  }`}></label>
              </div>
              <div className="flex flex-col cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                <span className={`text-sm font-bold ${d ? 'text-white' : 'text-slate-900'}`}>Post Anonymously</span>
                <span className={`text-[11px] ${d ? 'text-slate-500' : 'text-slate-400'}`}>Hide your identity on this request</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-4 text-white rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 ${d ? 'bg-gradient-to-r from-cyan-600 to-teal-500 shadow-cyan-500/20 hover:shadow-cyan-500/30'
                  : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'
                }`}
            >
              <span>{isAnonymous ? 'Post Anonymously' : 'Post Request'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
