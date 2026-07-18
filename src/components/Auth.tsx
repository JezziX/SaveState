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
        const testEmail = 'tester@savestate.dev';
        const testPassword = 'developer_test_password';
        
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

          <div className="pt-4 mt-4 border-t border-app-border w-full">
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
