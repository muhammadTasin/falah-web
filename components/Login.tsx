
import React, { useState } from 'react';
import { AlertCircle, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Leaf, Send } from 'lucide-react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface LoginProps {
  onGuestLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const Login: React.FC<LoginProps> = ({ onGuestLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification States
  const [showResend, setShowResend] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setShowResend(false);
    try {
      await signInWithPopup(auth, googleProvider);
      // Success is handled by onAuthStateChanged in App.tsx
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        // Ignore
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('এই ইমেইল দিয়ে ইতিমধ্যে অন্য পদ্ধতিতে (যেমন পাসওয়ার্ড দিয়ে) অ্যাকাউন্ট খোলা আছে।');
      } else {
        setError('গুগল লগইন এ সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন অথবা পরে চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setShowResend(false);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Send Verification Email
        await sendEmailVerification(userCredential.user, {
            url: "https://falah-a0153.web.app",
            handleCodeInApp: false
        });

        // Force Logout
        await signOut(auth);

        setSuccessMsg('অ্যাকাউন্ট তৈরি হয়েছে! ইমেইলে পাঠানো লিংকে ক্লিক করে ভেরিফাই করুন।');
        setMode('login');
      } else if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Block Unverified Users
        if (!cred.user.emailVerified) {
            setTempUser(cred.user);
            await signOut(auth);
            setShowResend(true);
            throw new Error("আপনার ইমেইল ভেরিফাই করা হয়নি। অনুগ্রহ করে ইমেইল চেক করুন।");
        }
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "আপনার ইমেইল ভেরিফাই করা হয়নি। অনুগ্রহ করে ইমেইল চেক করুন।") {
          setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') setError('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে।');
      else if (err.code === 'auth/wrong-password') setError('ভুল পাসওয়ার্ড।');
      else if (err.code === 'auth/user-not-found') setError('এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      else if (err.code === 'auth/weak-password') setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      else if (err.code === 'auth/too-many-requests') setError('অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      else setError('কোথাও সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
      if (!tempUser) return;
      setIsLoading(true);
      try {
          await sendEmailVerification(tempUser, {
            url: "https://falah-a0153.web.app",
            handleCodeInApp: false
          });
          setSuccessMsg('ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে।');
          setShowResend(false);
      } catch (e) {
          setError('ইমেইল পাঠাতে সমস্যা হয়েছে। আবার লগইন করে চেষ্টা করুন।');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
      
      <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 border border-white/40 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-white/40 p-8 pb-6 text-center border-b border-emerald-100/30">
           {/* Logo Section */}
          <div className="inline-flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-500">
             <img 
               src="/falah_logo.png" 
               alt="Falah Logo" 
               className="h-24 w-auto drop-shadow-lg object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement?.classList.add('fallback-logo');
               }}
             />
             <div className="hidden fallback-logo:flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full text-emerald-600 font-bold text-xl border-4 border-white shadow-lg">
                Falah
             </div>
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 mb-1 font-serif tracking-wide">ফালাহ</h1>
          <p className="text-emerald-600/80 text-sm font-medium flex items-center justify-center gap-1">
            <Leaf className="w-3 h-3" /> জান্নাতের পথে আপনার সঙ্গী
          </p>
        </div>
        
        <div className="p-8 pt-6">
          {error && (
            <div className="mb-4 bg-red-50/80 text-red-600 text-xs font-medium p-3 rounded-xl flex flex-col gap-2 border border-red-100 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
              </div>
              {showResend && (
                  <button 
                    onClick={handleResendVerification}
                    className="self-end text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" /> পুনরায় ইমেইল পাঠান
                  </button>
              )}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 bg-emerald-50/80 text-emerald-700 text-xs font-medium p-3 rounded-xl flex items-start gap-2 border border-emerald-100 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab Switcher */}
          {mode !== 'forgot' && (
            <div className="flex bg-white/40 p-1 rounded-xl mb-6 backdrop-blur-sm border border-white/40">
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white/80 text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    লগইন
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white/80 text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    রেজিস্ট্রেশন
                </button>
            </div>
          )}

          {mode === 'forgot' && (
             <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-gray-800">পাসওয়ার্ড পুনরুদ্ধার</h3>
                <p className="text-xs text-gray-500 mt-1">আপনার ইমেইল দিন, আমরা লিংক পাঠাবো।</p>
             </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                  required
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="email" 
                placeholder="ইমেইল অ্যাড্রেস"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                required
              />
            </div>

            {mode !== 'forgot' && (
                <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                    type="password" 
                    placeholder="পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                    required
                />
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <>
                     {mode === 'login' ? 'লগইন করুন' : mode === 'signup' ? 'অ্যাকাউন্ট খুলুন' : 'লিংক পাঠান'}
                     <ArrowRight className="w-4 h-4" />
                   </>
                )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:text-emerald-600 font-medium">
                    পাসওয়ার্ড ভুলে গেছেন?
                </button>
            </div>
          )}

          {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 font-medium">
                  লগইন এ ফিরে যান
              </button>
          )}

          {/* Divider */}
          {mode !== 'forgot' && (
              <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/50"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/60 px-2 text-gray-400 backdrop-blur-sm rounded-full">অথবা</span></div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white/80 border border-gray-200/50 hover:bg-white text-gray-700 font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>Google দিয়ে</span>
                    </button>

                    <button
                        onClick={onGuestLogin}
                        className="w-full bg-gradient-to-r from-gray-100/50 to-gray-50/50 border border-gray-200/50 text-gray-600 font-semibold py-3 rounded-xl hover:from-gray-200/50 hover:to-gray-100/50 transition-all active:scale-95 text-sm backdrop-blur-sm"
                    >
                        গেস্ট মোড (লগইন ছাড়া ব্যবহার)
                    </button>
                </div>
              </>
          )}

          <p className="text-[10px] text-center text-gray-400 mt-6 leading-relaxed">
            লগইন করার মাধ্যমে আপনি আপনার নামাজ ও আমলের ট্র্যাকিং ক্লাউডে সেভ করতে পারবেন। গেস্ট মোডে ডাটা শুধু এই ব্রাউজারে থাকবে।
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
