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
  CheckCircle,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import { RecaptchaVerifier } from 'firebase/auth';

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
  const { login, register, loginWithGoogle, sendPhoneOtp, confirmPhoneOtp } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(effectiveMode);
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>(effectiveRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone Auth states
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState<any>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(effectiveMode);
      setRole(effectiveRole);
      setError(null);
      setSuccess(null);
      setPhoneMode(false);
      setPhoneStep('input');
      setPhoneNumber('');
      setOtpCode('');
      setPhoneConfirmationResult(null);
      setPhoneError(null);
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
          password,
          role
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await loginWithGoogle(role);
      setSuccess('Successfully signed in with Google!');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      if (!(window as any).recaptchaModalVerifier) {
        (window as any).recaptchaModalVerifier = new RecaptchaVerifier(auth, 'recaptcha-modal-phone-container', {
          size: 'invisible'
        });
      }
      const confirmation = await sendPhoneOtp(phoneNumber.trim(), (window as any).recaptchaModalVerifier);
      setPhoneConfirmationResult(confirmation);
      setPhoneStep('otp');
    } catch (err: any) {
      if ((window as any).recaptchaModalVerifier) {
        try {
          (window as any).recaptchaModalVerifier.clear();
          (window as any).recaptchaModalVerifier = null;
        } catch {}
      }
      setPhoneError(err?.message || 'Failed to send SMS code. Please verify the phone number.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !phoneConfirmationResult) return;
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      await confirmPhoneOtp(phoneConfirmationResult, otpCode.trim(), role);
      setSuccess('Phone verification successful! Welcome.');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setPhoneError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setPhoneLoading(false);
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
              {phoneMode
                ? 'Phone Sign-In'
                : mode === 'login'
                ? 'Sign In to AlumNexa'
                : 'Join AlumNexa'}
            </h2>
            <p className="text-xs text-[#7E8696]">
              {phoneMode
                ? phoneStep === 'input'
                  ? 'Enter your mobile number with country code'
                  : 'Enter the 6-digit SMS verification code'
                : mode === 'login'
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
        {error && !phoneMode && (
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

        {phoneMode ? (
          /* Phone Sign-In Flow */
          <div className="p-6">
            <button
              type="button"
              onClick={() => {
                setPhoneMode(false);
                setPhoneError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#7E8696] hover:text-[#1F242D] font-medium mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to email sign-in</span>
            </button>

            {phoneError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}

            {phoneStep === 'input' ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#565D6D] mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] focus:outline-none focus:border-[#1F242D] focus:bg-white text-[#1F242D]"
                  />
                  <p className="text-[10px] text-[#7E8696] mt-1">
                    Include country code (e.g. +91 for India, +1 for US).
                  </p>
                </div>

                <div id="recaptcha-modal-phone-container"></div>

                <button
                  type="submit"
                  disabled={phoneLoading || !phoneNumber.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send SMS Code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#565D6D] mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit OTP"
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 text-center tracking-widest text-base font-mono rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] focus:outline-none focus:border-[#1F242D] focus:bg-white text-[#1F242D]"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#7E8696]">
                    <span>Sent to {phoneNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('input');
                        setOtpCode('');
                        setPhoneError(null);
                      }}
                      className="text-[#8458B3] hover:underline cursor-pointer"
                    >
                      Change number
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || otpCode.trim().length < 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Email / Password + Social Auth Form */
          <>
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
                  <label className="block text-xs font-semibold text-[#565D6D] mb-1.5">
                    I am registering as:
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
                          onClick={() => setRole(item.id as any)}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#1F242D] bg-[#1F242D] text-white shadow-xs'
                              : 'border-[#E6E1D7] bg-[#FAF8F5] text-[#565D6D] hover:bg-[#F2EFE8]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Social / Alternative Sign-in Buttons */}
              <div className="space-y-2.5">
                {/* Button 1: Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 py-2.5 px-4 font-medium text-sm rounded-xl transition-all text-[#1F242D] cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

                {/* Button 2: Phone Login */}
                <button
                  type="button"
                  onClick={() => {
                    setPhoneMode(true);
                    setPhoneStep('input');
                    setPhoneError(null);
                    setOtpCode('');
                  }}
                  disabled={loading}
                  className="w-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 py-2.5 px-4 font-medium text-sm rounded-xl transition-all text-[#1F242D] cursor-pointer disabled:opacity-50"
                >
                  <Phone className="w-4 h-4 text-[#5A7458] shrink-0" />
                  <span>Continue with phone number</span>
                </button>
              </div>

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
          </>
        )}
      </div>
    </div>
  );
};
