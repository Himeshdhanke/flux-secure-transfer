import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-grid-spec font-sans text-[#171e19]">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#171e19]/10 p-8 sm:p-10 shadow-2xl brutalist-transition">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-block group mb-3">
            <span className="font-anton text-4xl uppercase tracking-normal text-[#171e19] leading-none">
              FLUX<span className="text-[#ffe17c]">.</span>
            </span>
          </Link>
          <h2 className="font-anton text-3xl uppercase tracking-normal text-[#171e19]">
            CREATE FLUX VAULT
          </h2>
          <p className="font-satoshi text-xs text-[#171e19]/60 font-medium mt-1">
            Join the zero-leak confidential document transfer platform
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
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="text"
                placeholder="Dr. Alan Turing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="email"
                required
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="password"
                required
                placeholder="•••••••• (Min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl text-lg font-anton uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Provisioning Vault...' : 'Create Account'}
            <ArrowRight className="h-4 w-4 text-[#171e19]" />
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 flex items-center gap-2 text-[11px] font-satoshi text-[#171e19]/60 justify-center">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Zero-Trust Cognito & AES-256 Envelope Secured</span>
        </div>

        {/* Login link */}
        <div className="mt-4 text-center text-xs font-satoshi text-[#171e19]/60">
          Already have an account?{' '}
          <Link to="/login" className="text-[#171e19] font-bold underline underline-offset-2 decoration-[#ffe17c] decoration-2 hover:opacity-80">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
