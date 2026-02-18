
import React, { useState } from 'react';
import { HelpCategory, SeverityLevel } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: HelpCategory, description: string, severity: SeverityLevel, isAnonymous: boolean) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Request Help</h2>
                <p className="text-sm text-slate-500 mt-1">Ask the community for assistance</p>
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Category</label>
              <div className="flex flex-wrap gap-2.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                      category === cat 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-105' 
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Effort/Severity Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Effort Required</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSeverity('Low')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                    severity === 'Low'
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'Low' ? 'text-emerald-700' : 'text-slate-400'}`}>Easy</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'Low' ? 'text-emerald-600/80' : 'text-slate-400/80'}`}>Quick Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('Medium')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                    severity === 'Medium'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'Medium' ? 'text-blue-700' : 'text-slate-400'}`}>Medium</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'Medium' ? 'text-blue-600/80' : 'text-slate-400/80'}`}>Standard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('High')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                    severity === 'High'
                      ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500 shadow-md shadow-orange-500/10'
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <span className={`text-lg font-bold mb-1 ${severity === 'High' ? 'text-orange-700' : 'text-slate-400'}`}>Hard</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${severity === 'High' ? 'text-orange-600/80' : 'text-slate-400/80'}`}>Heavy</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Details</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what you need help with..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 min-h-[120px] text-sm resize-none font-medium placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="relative inline-block w-12 h-7 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 top-1 transition-transform duration-300 checked:translate-x-6 checked:border-slate-900 shadow-sm"
                  />
                  <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300 ${isAnonymous ? 'bg-slate-900' : 'bg-slate-200'}`}></label>
               </div>
               <div className="flex flex-col cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                   <span className="text-sm font-bold text-slate-800">Post Anonymously</span>
                   <span className="text-[11px] text-slate-500">Hide your identity on this request</span>
               </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2"
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
