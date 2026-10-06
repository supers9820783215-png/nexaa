import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { authService } from '../services/authService.ts';
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
  Mail,
  FileText,
  Lock,
  KeyRound,
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
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'support' | 'forgot' | null>(null);

  // Forgot Password Modal State
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
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

  const handleSendResetEmail = async () => {
    if (!resetEmail.trim()) {
      setResetStatus({ type: 'error', message: 'Please enter your registered collegiate email address.' });
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      const res = await authService.forgotPassword(resetEmail.trim());
      setResetStatus({ type: 'success', message: res.message });
    } catch (err: any) {
      setResetStatus({ type: 'error', message: err?.message || 'Failed to dispatch reset instructions.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetStatus({ type: 'error', message: 'Please enter your collegiate email address.' });
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetStatus({ type: 'error', message: 'Passwords do not match. Please verify.' });
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      const res = await authService.resetPasswordDirectly(resetEmail.trim(), resetNewPassword);
      setResetStatus({ type: 'success', message: res.message });
      setPassword(resetNewPassword);
      setEmail(resetEmail.trim());
      setTimeout(() => {
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      setResetStatus({ type: 'error', message: err?.message || 'Failed to update password.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col justify-center items-center py-4 px-3 sm:px-4 text-[#494D5F] selection:bg-[#8458B3] selection:text-white">
      <div className="w-full max-w-sm sm:max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header with green GraduationCap logo on the side */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#5A7458] text-white flex items-center justify-center shadow-xs shrink-0 transition-transform hover:scale-105">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] tracking-tight font-heading leading-tight">
              AlumNexa
            </h1>
            <p className="text-xs text-[#7E8696] font-medium mt-0.5">
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
                    onClick={() => {
                      setResetEmail(email.trim());
                      setResetNewPassword('');
                      setResetConfirmPassword('');
                      setResetStatus(null);
                      setActiveModal('forgot');
                    }}
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

        {/* Institutional Footer & Legal Links */}
        <div className="mt-2.5 text-center text-[10px] text-[#7E8696] space-y-1">
          <div className="flex items-center justify-center gap-3 font-medium">
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="hover:text-[#1F242D] hover:underline cursor-pointer transition-colors"
            >
              Terms of Service
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-[#1F242D] hover:underline cursor-pointer transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveModal('support')}
              className="hover:text-[#1F242D] hover:underline cursor-pointer transition-colors"
            >
              Help & Support
            </button>
          </div>
          <p>© {new Date().getFullYear()} DTSS College of Commerce (Autonomous) · AlumNexa</p>
        </div>
      </div>

      {/* Legal & Info Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E6E1D7] w-full max-w-md overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E1D7] bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                {activeModal === 'terms' && <FileText className="w-4 h-4 text-[#5A7458]" />}
                {activeModal === 'privacy' && <Lock className="w-4 h-4 text-[#5A7458]" />}
                {activeModal === 'support' && <Building2 className="w-4 h-4 text-[#5A7458]" />}
                {activeModal === 'forgot' && <KeyRound className="w-4 h-4 text-[#5A7458]" />}
                <h3 className="font-bold text-sm text-[#1F242D]">
                  {activeModal === 'terms' && 'Terms of Academic Service'}
                  {activeModal === 'privacy' && 'Privacy & Data Protection Policy'}
                  {activeModal === 'support' && 'Campus Help & Support'}
                  {activeModal === 'forgot' && 'Reset Collegiate Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-[#7E8696] hover:text-[#1F242D] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-[#565D6D] space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto">
              {activeModal === 'terms' && (
                <>
                  <p className="font-semibold text-[#1F242D]">
                    Collegiate Network Code of Conduct:
                  </p>
                  <p>
                    1. <strong>Institutional Access:</strong> AlumNexa is the dedicated portal of Dhirajlal Talakchand Sankalchand (DTSS) College of Commerce. Only current students, verified alumni, and faculty are permitted to access collegiate resources.
                  </p>
                  <p>
                    2. <strong>Professional Conduct:</strong> Members agree to engage respectfully during 1:1 mentorship sessions, discussions, and event participation. Any harassment or unsolicited advertising results in immediate account suspension.
                  </p>
                  <p>
                    3. <strong>Job & Referral Integrity:</strong> All posted opportunities and referrals must be authentic and non-commercial.
                  </p>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p className="font-semibold text-[#1F242D]">
                    Commitment to Student & Alumni Privacy:
                  </p>
                  <p>
                    1. <strong>Academic Data Security:</strong> Student roll numbers, academic records, and personal contact details are stored under secure encryption and are never exposed publicly.
                  </p>
                  <p>
                    2. <strong>Gated Networking:</strong> Personal contact info (phone/email) is protected. Direct messaging is only enabled upon mutual connection acceptance.
                  </p>
                  <p>
                    3. <strong>Zero Third-Party Sharing:</strong> Your personal data is never sold or shared with any third-party marketing companies.
                  </p>
                </>
              )}

              {activeModal === 'support' && (
                <>
                  <p className="font-semibold text-[#1F242D]">
                    DTSS College Alumni & IT Secretariat:
                  </p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                      <Mail className="w-4 h-4 text-[#5A7458] shrink-0" />
                      <div>
                        <div className="font-bold text-[#1F242D]">Technical & Account Support</div>
                        <div className="text-[11px] text-[#7E8696]">support@dtss.ac.in</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                      <Building2 className="w-4 h-4 text-[#5A7458] shrink-0" />
                      <div>
                        <div className="font-bold text-[#1F242D]">Campus Location</div>
                        <div className="text-[11px] text-[#7E8696]">Kurar Village, Malad (East), Mumbai, Maharashtra 400097</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'forgot' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#565D6D] leading-relaxed">
                    Enter your registered collegiate email address below. You can immediately set a new password or request an email reset link.
                  </p>

                  {resetStatus && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                        resetStatus.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {resetStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{resetStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleDirectPasswordReset} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-1">
                        Registered Email Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-1">
                        New Password (Min 6 chars) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-1">
                        Confirm New Password <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D] focus:bg-white"
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#1F242D] text-white text-xs font-bold hover:bg-[#343A46] transition-colors disabled:opacity-50 cursor-pointer text-center"
                      >
                        {resetLoading ? 'Updating...' : 'Set New Password Now'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendResetEmail}
                        disabled={resetLoading || !resetEmail.trim()}
                        className="py-2 px-3 rounded-xl border border-[#DCD6C9] bg-[#FAF8F5] text-[#1F242D] text-xs font-semibold hover:bg-[#EFEBE3] transition-colors disabled:opacity-50 cursor-pointer text-center"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#E6E1D7] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-[#1F242D] text-white font-semibold text-xs hover:bg-[#343A46] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

