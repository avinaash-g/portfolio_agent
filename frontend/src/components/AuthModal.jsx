import React, { useState } from "react";
import { X, Lock, Mail, User, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTabSwitch = (registerMode) => {
    setIsRegister(registerMode);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError("Please provide a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isRegister && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(cleanName, cleanEmail, password);
      } else {
        await login(cleanEmail, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setName("Alex Rivera");
    setEmail(`demo_${Date.now()}@example.com`);
    setPassword("DemoPassword123!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1F3B]/60 backdrop-blur-sm animate-subtle-fade">
      <div className="relative w-full max-w-md bg-white border border-[#E5DFD7] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1B1F3B]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#1B1F3B]/50 hover:text-[#1B1F3B] hover:bg-[#EAE4DC] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#6B3074] text-white flex items-center justify-center mx-auto mb-3 shadow-soft">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#1B1F3B] tracking-tight">
            {isRegister ? "Create an Account" : "Sign In to Your Workspace"}
          </h3>
          <p className="text-xs text-[#1B1F3B]/70 mt-1">
            Build and publish clean, recruiter-tailored engineering portfolios.
          </p>
        </div>

        {/* Segmented Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF7F4] rounded-xl mb-5 border border-[#E5DFD7]">
          <button
            type="button"
            onClick={() => handleTabSwitch(false)}
            className={`py-1.5 text-xs font-medium rounded-lg transition ${
              !isRegister
                ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                : "text-[#1B1F3B]/60 hover:text-[#1B1F3B]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch(true)}
            className={`py-1.5 text-xs font-medium rounded-lg transition ${
              isRegister
                ? "bg-[#6B3074] text-white font-semibold shadow-xs"
                : "text-[#1B1F3B]/60 hover:text-[#1B1F3B]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Pre-fill */}
        <button
          type="button"
          onClick={fillDemoAccount}
          className="w-full mb-5 py-2 px-3 rounded-lg bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#DCD5CB] text-xs font-medium text-[#1B1F3B] flex items-center justify-center space-x-2 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6B3074]" />
          <span>Quick 1-Click Demo Credentials</span>
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-[#E5DFD7] w-full"></div>
          <span className="bg-white px-2.5 text-[11px] uppercase tracking-wider text-[#1B1F3B]/50 font-mono">
            Or credentials
          </span>
          <div className="border-t border-[#E5DFD7] w-full"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-[#1B1F3B] font-semibold mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-hidden focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#1B1F3B] font-semibold mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-hidden focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1B1F3B] font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#1B1F3B]/40" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD5CB] rounded-lg text-[#1B1F3B] placeholder-[#1B1F3B]/40 focus:outline-hidden focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold transition shadow-coral disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#1B1F3B]/70">
          {isRegister ? (
            <p>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => handleTabSwitch(false)}
                className="text-[#6B3074] font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => handleTabSwitch(true)}
                className="text-[#6B3074] font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
