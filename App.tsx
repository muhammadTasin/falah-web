
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { UserSettings } from './types';
import { getSettings, saveSettings } from './services/storage';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('falah_guest_mode') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If we have a user, we are definitely not in guest mode anymore
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('falah_guest_mode');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem('falah_guest_mode');
      setIsGuest(false);
    } else {
      await auth.signOut();
    }
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    localStorage.setItem('falah_guest_mode', 'true');
  };

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-200 text-gray-800 relative">
      
      {/* Vibrant Mesh Gradient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-emerald-50">
         {/* Base Gradient */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-amber-50"></div>
         
         {/* Colorful Orbs for Depth */}
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-300/20 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/20 rounded-full blur-[120px]"></div>
         <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-yellow-200/30 rounded-full blur-[100px]"></div>
         
         {/* Subtle Noise Texture overlay */}
         <div className="absolute inset-0 opacity-[0.3] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light"></div>
      </div>

      {(user?.emailVerified || isGuest) ? (
        <Dashboard 
          user={user}
          isGuest={isGuest}
          settings={settings} 
          onUpdateSettings={updateSettings} 
          onLogout={handleLogout} 
        />
      ) : (
        <Login onGuestLogin={handleGuestLogin} />
      )}
    </div>
  );
};

export default App;
