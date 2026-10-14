import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthScreen({ setUserRole, setCurrentView, onAuthSuccess }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('retailer');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email.trim(), password);
      const user = res.data.user;

      setUserRole(user.role);
      if (onAuthSuccess) onAuthSuccess(user);

      // Navigate based on verified role from server
      if (user.role === 'admin') {
        setCurrentView('admin-dash');
      } else if (user.role === 'seller') {
        setCurrentView('seller-dash');
      } else {
        setCurrentView('retailer-dash');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role: selectedRole, // 'retailer' or 'seller' (admin is blocked server-side)
        phone: phone.trim() || undefined,
        businessName: businessName.trim() || undefined,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined
      };

      const res = await authApi.register(payload);
      const user = res.data.user;

      setUserRole(user.role);
      if (onAuthSuccess) onAuthSuccess(user);

      if (user.role === 'seller') {
        setCurrentView('seller-dash');
      } else {
        setCurrentView('retailer-dash');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#E0D8C0] p-8 shadow-sm mt-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#482922] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow">
          प
        </div>
        <h2 className="text-xl font-bold text-[#482922]">
          {isAdminMode
            ? 'Admin Portal Secure Access'
            : isRegisterMode
            ? 'Join Pavitra B2B Wholesale'
            : 'Welcome to Pavitra B2B'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isAdminMode
            ? 'System Administration Portal (Live Verified)'
            : isRegisterMode
            ? 'Create direct mill trading account'
            : 'Enter your verified business credentials to proceed'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isAdminMode ? (
        /* Admin Login Form */
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Email</label>
            <input 
              type="email" 
              placeholder="admin@pavitra.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#482922] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#351e19] transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Authenticate Admin</span>
          </button>

          <button 
            type="button"
            onClick={() => { setIsAdminMode(false); setError(''); }}
            className="w-full text-xs text-gray-500 hover:text-gray-800 text-center mt-2"
          >
            ← Back to regular user login
          </button>
        </form>
      ) : isRegisterMode ? (
        /* Business Registration Form */
        <form onSubmit={handleRegister} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name / Contact Person</label>
            <input 
              type="text" 
              placeholder="e.g. Ramesh Chandra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email</label>
            <input 
              type="email" 
              placeholder="name@textiles.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name</label>
              <input 
                type="text" 
                placeholder="Shop / Loom Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#482922]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#482922]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN Number (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#482922] uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Registering As:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('retailer')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  selectedRole === 'retailer'
                    ? 'bg-[#482922] text-white border-[#482922]'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Retailer Buyer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('seller')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  selectedRole === 'seller'
                    ? 'bg-[#482922] text-white border-[#482922]'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Weaver / Mill
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#482922] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#351e19] transition shadow flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Create B2B Account</span>
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              className="text-[#482922] font-semibold underline"
            >
              Sign In
            </button>
          </p>
        </form>
      ) : (
        /* Regular User Login */
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email</label>
            <input 
              type="email" 
              placeholder="registered@textiles.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#482922] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#351e19] transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Sign In with Credentials</span>
          </button>

          <p className="text-center text-xs text-gray-500 pt-2">
            New wholesale buyer or weaver?{' '}
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              className="text-[#482922] font-semibold underline"
            >
              Create an Account
            </button>
          </p>

          {/* Discreet Admin Login Trigger */}
          <div className="pt-6 border-t border-gray-100 text-center">
            <button 
              type="button"
              onClick={() => { setIsAdminMode(true); setError(''); }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#482922] transition font-medium"
            >
              <ShieldAlert size={14} />
              <span>System Administrator Login</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}