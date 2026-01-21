
import React, { useState, useRef } from 'react';
import { UserSettings } from '../types';
import { districts } from '../data/districts';
import { Save, MapPin, Moon, Download, Upload, Database, AlertCircle } from 'lucide-react';
import { createBackup, restoreBackup } from '../services/storage';

interface SettingsProps {
  currentSettings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleDownloadBackup = () => {
    const data = createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `falah_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("আপনি কি নিশ্চিত? ব্যাকআপ রিস্টোর করলে বর্তমানের কিছু ডাটা রিপ্লেস হতে পারে। (Are you sure? This will overwrite current data.)")) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = restoreBackup(content);
      if (success) {
        alert("ডাটা সফলভাবে রিস্টোর করা হয়েছে! অ্যাপটি রিলোড হচ্ছে...");
        window.location.reload();
      } else {
        alert("দুঃখিত, ফাইলটি সঠিক নয় বা করাপ্টেড।");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        সেটিংস (Settings)
      </h2>

      <div className="space-y-6">
        {/* District Selection (New) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">জেলা নির্বাচন করুন (District)</label>
          <select 
            value={settings.district || 'dhaka'}
            onChange={(e) => setSettings({...settings, district: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 max-h-40"
          >
            {districts.map(d => (
              <option key={d.id} value={d.id}>
                {d.nameBn} ({d.nameEn})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">আপনার জেলার ভিত্তিতে নামাজের সময় ও সেহরি/ইফতার দেখানো হবে।</p>
        </div>

        {/* Calculation Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">গণনা পদ্ধতি (Calculation)</label>
          <select 
             value={settings.calculationMethod}
             onChange={(e) => setSettings({...settings, calculationMethod: e.target.value})}
             className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
          >
            <option value="Islamic Foundation Bangladesh">ইসলামিক ফাউন্ডেশন বাংলাদেশ (Karachi Method)</option>
            <option value="Muslim World League">মুসলিম ওয়ার্ল্ড লিগ</option>
          </select>
        </div>

        {/* Madhhab */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">মাজহাব (Madhhab)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="madhhab" 
                value="hanafi"
                checked={settings.madhhab === 'hanafi'}
                onChange={() => setSettings({...settings, madhhab: 'hanafi'})}
                className="text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="text-gray-700">হানাফী (Hanafi)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="madhhab" 
                value="shafi"
                checked={settings.madhhab === 'shafi'}
                onChange={() => setSettings({...settings, madhhab: 'shafi'})}
                className="text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="text-gray-700">শাফেয়ী/অন্যান্য</span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">হানাফী মাজহাবে আসরের ওয়াক্ত কিছুটা পরে শুরু হয়।</p>
        </div>

        <hr className="border-gray-100" />

        {/* Moon Sighting */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-600" />
              চাঁদ দেখার ভিত্তিতে তারিখ পরিবর্তন
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.useMoonSighting}
                onChange={(e) => setSettings({...settings, useMoonSighting: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          
          {settings.useMoonSighting && (
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-xs text-emerald-700 mb-2">হিজরি তারিখ একদিন আগে বা পরে হলে এখানে পরিবর্তন করুন:</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSettings(s => ({...s, moonSightingOffset: s.moonSightingOffset - 1}))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-emerald-700 font-bold hover:bg-emerald-100"
                >-</button>
                <span className="font-mono font-medium w-6 text-center text-emerald-900">
                  {settings.moonSightingOffset > 0 ? `+${settings.moonSightingOffset}` : settings.moonSightingOffset}
                </span>
                <button 
                  onClick={() => setSettings(s => ({...s, moonSightingOffset: s.moonSightingOffset + 1}))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-emerald-700 font-bold hover:bg-emerald-100"
                >+</button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Data Backup */}
        <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                ডাটা ব্যাকআপ ও রিস্টোর
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleDownloadBackup}
                        className="flex items-center justify-center gap-2 bg-white border border-emerald-200 text-emerald-700 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        ব্যাকআপ ডাউনলোড করুন
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" 
                        />
                        <button 
                            onClick={handleRestoreClick}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-700 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            ব্যাকআপ রিস্টোর করুন
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Save className="w-5 h-5" />
          সেভ করুন
        </button>
      </div>
    </div>
  );
};

export default Settings;
