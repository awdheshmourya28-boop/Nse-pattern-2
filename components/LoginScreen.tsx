import React, { useState } from 'react';
import { Lock, User, Key, BarChart3, ArrowRight, Loader2, Mail, Phone, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login State
  const [loginInput, setLoginInput] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  
  // Sign Up State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- MOCK DATABASE HELPERS ---
  const getUsersDB = () => {
    const db = localStorage.getItem('nse_users_db');
    return db ? JSON.parse(db) : [];
  };

  const addUserToDB = (user: any) => {
    const db = getUsersDB();
    db.push(user);
    localStorage.setItem('nse_users_db', JSON.stringify(db));
  };

  const findUser = (identifier: string) => {
    const db = getUsersDB();
    return db.find((u: any) => u.email === identifier || u.phone === identifier);
  };
  // -----------------------------

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API authentication delay
    setTimeout(() => {
      // 1. Check Hardcoded Admin
      if (loginInput === 'admin' && password === 'admin') {
         const adminUser = { id: 'admin', name: 'Administrator', role: 'admin' };
         localStorage.setItem('nse_active_session', JSON.stringify(adminUser));
         onLogin();
         return;
      }

      // 2. Check Mock Database
      const user = findUser(loginInput);

      if (user && user.password === password) {
         // Create Session
         const sessionUser = { ...user, password: undefined }; // Don't put password in session
         localStorage.setItem('nse_active_session', JSON.stringify(sessionUser));
         onLogin();
      } else {
         setError('Invalid credentials. User not found or password incorrect.');
         setIsLoading(false);
      }
    }, 1200);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // 1. Validation
      if (!email.toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
      }
      
      const phoneClean = phone.replace(/\D/g,'');
      if (phoneClean.length < 10) {
        setError('Please enter a valid 10-digit phone number.');
        setIsLoading(false);
        return;
      }

      if (signupPassword.length < 4) {
        setError('Password must be at least 4 characters.');
        setIsLoading(false);
        return;
      }

      // 2. Check if user exists
      if (findUser(email) || findUser(phoneClean)) {
        setError('Account with this email or phone already exists.');
        setIsLoading(false);
        return;
      }

      // 3. Register User
      const newUser = { 
        id: crypto.randomUUID(),
        email, 
        phone: phoneClean, 
        password: signupPassword, // Note: In real app, never store plain text password
        role: 'user',
        createdAt: new Date().toISOString() 
      };

      addUserToDB(newUser);

      // 4. Auto Login after Signup
      const sessionUser = { ...newUser, password: undefined };
      localStorage.setItem('nse_active_session', JSON.stringify(sessionUser));

      onLogin(); 
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-10 overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-8 text-center">
          <div className="mx-auto bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NSE PatternAlpha</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {isSignUp ? 'Create New Account' : 'Algorithmic Trading Terminal'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {isSignUp ? (
             /* SIGN UP FORM */
             <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Gmail Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="user@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Set Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Create secure password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-rose-400 text-sm animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
             </form>
          ) : (
             /* LOGIN FORM */
             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email or Phone</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Enter Email or Phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Enter Password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-rose-400 text-sm animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Terminal</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
             </form>
          )}

          <div className="mt-6 text-center border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-400">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all"
              >
                {isSignUp ? "Login here" : "Sign up"}
              </button>
            </p>
          </div>
          
          {!isSignUp && (
            <div className="mt-4 text-center">
               <p className="text-xs text-slate-600">
                 Demo: <span className="font-mono">admin / admin</span>
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;