
import React, { useState, useRef, useEffect } from 'react';
import { PrayerRecord, PrayerStatus } from '../types';
import { Check, MoreVertical, X, RotateCcw, StickyNote, CheckCircle2 } from 'lucide-react';

interface PrayerItemProps {
  prayer: PrayerRecord;
  isActive: boolean;
  onUpdate: (id: string, status: PrayerStatus, note?: string) => void;
}

const PrayerItem: React.FC<PrayerItemProps> = ({ prayer, isActive, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(prayer.note || '');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: 'done' | 'missed' | 'reset' | 'note') => {
    setShowMenu(false);
    if (action === 'done') onUpdate(prayer.id, 'done');
    if (action === 'missed') onUpdate(prayer.id, 'missed');
    if (action === 'reset') onUpdate(prayer.id, 'none');
    if (action === 'note') setIsEditingNote(true);
  };

  const saveNote = () => {
    onUpdate(prayer.id, prayer.status, noteText);
    setIsEditingNote(false);
  };

  // Status Styles
  const isDone = prayer.status === 'done';
  const isMissed = prayer.status === 'missed';

  return (
    <div className={`
      relative rounded-2xl p-4 transition-all duration-300
      ${isActive 
        ? 'bg-gradient-to-r from-white/95 to-amber-50/90 ring-2 ring-amber-400/50 shadow-md scale-[1.01] z-10' 
        : 'bg-white/70 hover:bg-white/90 shadow-sm border border-white/50'}
      ${isDone ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-100/50' : ''}
      ${isMissed ? 'bg-gradient-to-r from-red-50/80 to-pink-50/80 border-red-100/50' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           {/* Primary Checkbox */}
           <button 
             onClick={() => onUpdate(prayer.id, isDone ? 'none' : 'done')}
             className={`
               w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 active:scale-95 shadow-sm
               ${isDone 
                 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200' 
                 : isMissed 
                   ? 'bg-red-100 text-red-500' 
                   : 'bg-white text-gray-300 hover:bg-emerald-50 hover:text-emerald-400 border border-gray-100'}
             `}
           >
             {isDone ? <Check className="w-6 h-6" /> : isMissed ? <X className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
           </button>

           <div className="flex flex-col">
              <h3 className={`text-base font-bold ${isDone ? 'text-emerald-900' : isMissed ? 'text-red-900' : 'text-gray-800'}`}>
                {prayer.label}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prayer.isFarz ? 'bg-gray-200/50 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
                    {prayer.isEid ? 'ওয়াজিব' : prayer.isFarz ? 'ফরজ' : 'নফল'}
                </span>
                {isActive && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        চলছে
                    </span>
                )}
              </div>
           </div>
        </div>

        <div className="relative" ref={menuRef}>
           <button 
             onClick={() => setShowMenu(!showMenu)}
             className="p-2 rounded-full text-gray-400 hover:bg-white hover:shadow-sm active:bg-gray-50 transition-all"
           >
             <MoreVertical className="w-5 h-5" />
           </button>

           {/* 3-Dot Dropdown Menu */}
           {showMenu && (
               <div className="absolute right-0 top-10 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <button onClick={() => handleAction('done')} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-3 transition-colors">
                       <CheckCircle2 className="w-4 h-4" /> সম্পন্ন (Done)
                   </button>
                   <button onClick={() => handleAction('missed')} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 border-t border-gray-50 transition-colors">
                       <X className="w-4 h-4" /> কাজা / মিস (Missed)
                   </button>
                   <button onClick={() => handleAction('note')} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 border-t border-gray-50 transition-colors">
                       <StickyNote className="w-4 h-4" /> নোট যুক্ত করুন
                   </button>
                   <button onClick={() => handleAction('reset')} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50 transition-colors">
                       <RotateCcw className="w-4 h-4" /> রিসেট (Reset)
                   </button>
               </div>
           )}
        </div>
      </div>

      {/* Note Display/Edit */}
      {(isEditingNote || prayer.note) && (
        <div className="mt-3 ml-[4.5rem]">
            {isEditingNote ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <input 
                type="text" 
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="নোট লিখুন..."
                className="flex-1 text-sm p-2.5 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white/80"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                />
                <button onClick={saveNote} className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 shadow-sm font-medium">সেভ</button>
            </div>
            ) : (
             <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-2.5 flex items-start gap-2">
                 <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                 <p className="text-xs text-gray-700 italic">"{prayer.note}"</p>
             </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PrayerItem;
