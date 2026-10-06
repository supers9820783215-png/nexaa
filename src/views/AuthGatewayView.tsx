import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AlumniLogo } from '../components/AlumniLogo.tsx';
import {
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  X
} from 'lucide-react';

interface AuthGatewayViewProps {
  onEnterApp: () => void;
  onExploreAsGuest?: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({
  onEnterApp,
  onExploreAsGuest,
  initialMode = 'login'
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State - strictly collected
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        await login(email.trim(), password, rememberMe);
        setSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          onEnterApp();
        }, 400);
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
          password,
          role
        });
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onEnterApp();
        }, 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await loginWithGoogle(role);
      setSuccess('Signed in with Google successfully!');
      setTimeout(() => {
        onEnterApp();
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col justify-center items-center py-4 px-3 sm:px-4 text-[#494D5F] selection:bg-[#8458B3] selection:text-white">
      <div className="w-full max-w-sm sm:max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Compact Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-xs border border-[#E6E1D7] p-1.5 transition-transform hover:scale-105">
            <AlumniLogo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F242D] tracking-tight font-heading leading-tight">
              AlumNexa
            </h1>
            <p className="text-[11px] text-[#7E8696] font-medium leading-tight">
              DTSS College of Commerce · Alumni Network
            </p>
          </div>
        </div>

        {/* Main Elevated Auth Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E6E1D7] shadow-xl">
          
          {/* Segmented Mode Selector: Login vs Create Account */}
          <div className="flex p-1 rounded-xl bg-[#F4F1EA] border border-[#E6E1D7] mb-3">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#1F242D] shadow-xs'
                  : 'text-[#7E8696] hover:text-[#1F242D]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#1F242D] shadow-xs'
                  : 'text-[#7E8696] hover:text-[#1F242D]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[#1F242D] tracking-tight font-heading">
              {mode === 'login' ? 'Welcome back' : 'Create an Account'}
            </h2>
            <p className="text-[11px] text-[#7E8696] mt-0.5">
              {mode === 'login'
                ? 'Sign in to your collegiate account'
                : 'Join the DTSS College of Commerce alumni network'}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-3 p-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#166534] flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
            {mode === 'register' && (
              <>
                {/* Role Tabs for Registration */}
                <div>
                  <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-1">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'STUDENT', label: 'Student', icon: GraduationCap },
                      { id: 'ALUMNI', label: 'Alumni', icon: Briefcase },
                      { id: 'FACULTY', label: 'Faculty', icon: Shield }
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = role === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setRole(item.id as any);
                            setError(null);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1F242D] text-white border-[#1F242D] shadow-xs'
                              : 'bg-[#FAF8F5] text-[#565D6D] border-[#E6E1D7] hover:bg-[#F2EFE8]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-0.5">
                    Full Name <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Aryan Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white transition-colors"
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-0.5">
                Email Address <span className="text-[#991B1B]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'login' ? 'you@example.com' : 'you@college.edu or email@domain.com'}
                className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider">
                  Password <span className="text-[#991B1B]">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link will be sent to your registered email.')}
                    className="text-[10px] font-semibold text-[#8458B3] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password (min 6 characters)"
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E8696] hover:text-[#1F242D] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            {mode === 'login' && (
              <div className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  id="rememberMeCenter"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#DCD6C9] text-[#1F242D] focus:ring-[#1F242D]"
                />
                <label htmlFor="rememberMeCenter" className="text-[11px] text-[#565D6D] cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={
                loading ||
                (mode === 'login' && (!email.trim() || !password)) ||
                (mode === 'register' && (!name.trim() || !email.trim() || !password))
              }
              className="w-full py-2.5 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-2.5 text-[10px] text-gray-400 font-medium">or</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Social / Alternative Sign-in Options */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2.5 py-2 px-3 font-semibold text-xs rounded-xl transition-all text-[#1F242D] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.47 8.24 0 10.06 0 12s.47 3.76 1.28 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-3 text-center text-xs text-[#7E8696]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="font-bold text-[#8458B3] hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="font-bold text-[#8458B3] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Subtle Institutional Footer */}
        <div className="mt-2.5 text-center text-[10px] text-[#7E8696]">
          <p>© {new Date().getFullYear()} DTSS College of Commerce · AlumNexa Ecosystem</p>
        </div>
      </div>
    </div>
  );
};

