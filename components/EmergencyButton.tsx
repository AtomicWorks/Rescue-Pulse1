
import React, { useState } from 'react';

interface EmergencyButtonProps {
  onTrigger: (category: string, description: string) => void;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical');

  const categories = ['Medical', 'Fire', 'Security', 'Mechanical', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTrigger(category, description);
    setIsOpen(false);
    setDescription('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.6)] animate-pulse-red hover:scale-110 active:scale-95 transition-all duration-300 z-50 fixed bottom-24 right-4 sm:bottom-8 sm:right-8 border-4 border-white/20 backdrop-blur-sm"
      >
        SOS
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Request Help</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Type</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-2 text-xs sm:text-sm rounded-xl font-bold transition-all duration-200 ${
                    category === cat
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Situation Details</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[120px] text-sm transition-all resize-none font-medium placeholder:text-slate-400"
              placeholder="Describe the emergency quickly... (e.g. Location context, number of people involved)"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            BROADCAST ALARM
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmergencyButton;
