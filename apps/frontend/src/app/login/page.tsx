'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const { login, signup, googleSignIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Redirect to dashboard if already authenticated (in effect, not during render)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, name.trim());
      }
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await googleSignIn();
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  }

  const isFormValid =
    email.trim() && password.trim() && (mode === 'login' || name.trim());

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-echo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-5xl mb-4"
          >
            🔍
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-echo-400 to-violet-400 bg-clip-text text-transparent">
            EchoTrace AI
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Turn scattered evidence into an explainable investigation timeline
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-surface-300/30 bg-surface/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-surface-300/30">
            <button
              onClick={() => mode !== 'login' && switchMode()}
              className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
                mode === 'login'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
              {mode === 'login' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-echo-500 rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => mode !== 'signup' && switchMode()}
              className={`flex-1 py-3.5 text-sm font-medium transition-all relative ${
                mode === 'signup'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
              {mode === 'signup' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-echo-500 rounded-full"
                />
              )}
            </button>
          </div>

          <div className="p-6">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting}
              className="w-full py-2.5 px-4 text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 shadow-sm"
            >
              {isGoogleSubmitting ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isGoogleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-300/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 text-sm bg-surface-200/50 border border-surface-300/30 rounded-xl focus:outline-none focus:border-echo-500/50 focus:ring-1 focus:ring-echo-500/20 text-foreground placeholder:text-muted-foreground transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface-200/50 border border-surface-300/30 rounded-xl focus:outline-none focus:border-echo-500/50 focus:ring-1 focus:ring-echo-500/20 text-foreground placeholder:text-muted-foreground transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                  className="w-full px-3.5 py-2.5 text-sm bg-surface-200/50 border border-surface-300/30 rounded-xl focus:outline-none focus:border-echo-500/50 focus:ring-1 focus:ring-echo-500/20 text-foreground placeholder:text-muted-foreground transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-echo-600 to-violet-600 hover:from-echo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-echo-600/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'}</>
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p className="mt-5 text-center text-xs text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={switchMode} className="text-echo-400 hover:text-echo-300 font-medium transition-colors">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={switchMode} className="text-echo-400 hover:text-echo-300 font-medium transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[10px] text-muted-foreground">
          By continuing, you agree to EchoTrace&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
