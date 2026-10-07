import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  GraduationCap,
  Briefcase,
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  initialMode?: 'login' | 'register';
  defaultRole?: 'STUDENT' | 'ALUMNI' | 'FACULTY';
  initialRole?: 'STUDENT' | 'ALUMNI' | 'FACULTY';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  initialMode,
  defaultRole = 'STUDENT',
  initialRole
}) => {
  const effectiveMode = initialMode || defaultMode;
  const effectiveRole = initialRole || defaultRole;
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(effectiveMode);
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>(effectiveRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(effectiveMode);
      setRole(effectiveRole);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, effectiveMode, effectiveRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        await login(email.trim(), password, true);
        onClose();
      } else {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in your name, email, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        await register({
          name: name.trim(),
          email: email.trim(),
          password
        });
        setSuccess('Registration successful! Welcome to AlumNexa.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F242D]/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="auth-modal"
        className="bg-white rounded-3xl shadow-2xl border border-[#E6E1D7] w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E1D7] bg-[#FAF8F5]">
          <div>
            <h2 className="text-lg font-bold text-[#1F242D] font-heading">
              {mode === 'login' ? 'Sign In to AlumNexa' : 'Join AlumNexa'}
            </h2>
            <p className="text-xs text-[#7E8696]">
              {mode === 'login'
                ? 'Enter your credentials to access your portal'
                : 'Create your account with role, email, and password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7E8696] hover:text-[#1F242D] hover:bg-[#EFEBE3] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border border-[#E6E1D7] bg-[#FAF8F5] p-1 m-6 mb-4 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#1F242D] shadow-xs'
                    : 'text-[#7E8696] hover:text-[#1F242D]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#1F242D] shadow-xs'
                    : 'text-[#7E8696] hover:text-[#1F242D]'
                }`}
              >
                Create New Account
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#565D6D] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-[#7E8696]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aryan Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#565D6D] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#7E8696]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#565D6D] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#7E8696]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="auth-submit-btn"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>


              <div className="text-center pt-2">
                <span className="text-[11px] text-[#7E8696]">
                  {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                  className="text-[11px] font-bold text-[#8458B3] hover:underline ml-1 cursor-pointer"
                >
                  {mode === 'login' ? 'Register here' : 'Sign in here'}
                </button>
              </div>
            </form>
      </div>
    </div>
  );
};
