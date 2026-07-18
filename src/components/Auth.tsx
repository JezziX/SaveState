import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Password reset link sent to your email.');
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Check your email for the login link or you might be logged in immediately if email confirmations are off.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setErrorMsg(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
        const testEmail = 'devtester@savestate.internal';
        const testPassword = 'static_dev_password_123';
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
        });
        
        if (signInError && signInError.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
                email: testEmail,
                password: testPassword,
            });
            if (signUpError) throw signUpError;
            setSuccessMsg('Test account created. If email confirmations are off, you will be logged in.');
        } else if (signInError) {
            throw signInError;
        }
    } catch (error: any) {
         setErrorMsg(error.error_description || error.message);
    } finally {
         setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.error_description || error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-base p-4">
      <div className="bg-app-card border border-app-border rounded-xl p-8 max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/[0.05] blur-[50px] rounded-full pointer-events-none" />
        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">SaveState</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Sign in to sync your library across devices</p>
        </div>
        
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md relative z-10 text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-md relative z-10 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-app-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
              required
            />
          </div>
          
          {!isResetPassword && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-app-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                required
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-purple hover:bg-[#ebdcf2] text-[#340F04] font-bold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isResetPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="text-center space-y-3 relative z-10 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsResetPassword(false);
            }}
            className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>

          {!isSignUp && (
            <button
              type="button"
              onClick={() => setIsResetPassword(!isResetPassword)}
              className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
            >
              {isResetPassword ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          )}

          <div className="pt-4 mt-4 border-t border-app-border w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full py-2 bg-black/40 border border-app-border hover:bg-black/60 text-[var(--color-text-muted)] hover:text-white font-medium text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              Developer Test Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
