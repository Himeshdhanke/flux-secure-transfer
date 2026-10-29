import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const suggestedEmail = location.state?.suggestedEmail || '';
  const [email, setEmail] = useState(suggestedEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Redirect to original target if redirected from a protected viewer share link
  const from = location.state?.from?.pathname || location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-grid-spec font-sans text-[#171e19]">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#171e19]/10 p-5 sm:p-10 shadow-2xl brutalist-transition">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-block group mb-3">
            <span className="font-anton text-4xl uppercase tracking-normal text-[#171e19] leading-none">
              FLUX<span className="text-[#ffe17c]">.</span>
            </span>
          </Link>
          <h2 className="font-anton text-3xl uppercase tracking-normal text-[#171e19]">
            SIGN IN TO VAULT
          </h2>
          <p className="font-satoshi text-xs text-[#171e19]/60 font-medium mt-1">
            Authenticate to manage encrypted documents or unlock protected shares
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-satoshi font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-satoshi">
          <div>
            <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl text-lg font-anton uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In Now'}
            <ArrowRight className="h-4 w-4 text-[#171e19]" />
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-8 pt-6 border-t border-[#171e19]/10 flex items-center gap-2 text-[11px] font-satoshi text-[#171e19]/60 justify-center">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Zero-Trust Cognito & AES-256 Envelope Secured</span>
        </div>

        {/* Register link */}
        <div className="mt-4 text-center text-xs font-satoshi text-[#171e19]/60">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-[#171e19] font-bold underline underline-offset-2 decoration-[#ffe17c] decoration-2 hover:opacity-80">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
