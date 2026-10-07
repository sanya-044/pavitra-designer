 import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AuthScreen({ setUserRole, setCurrentView }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // Secure admin check simulation
    if (email === 'admin@pavitra.com' && password === 'admin123') {
      setUserRole('admin');
      setCurrentView('admin-dash');
    } else {
      alert('Invalid Administrator Credentials. Access Denied.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#E0D8C0] p-8 shadow-sm mt-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#482922] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow">
          प
        </div>
        <h2 className="text-xl font-bold text-[#482922]">
          {isAdminMode ? 'Admin Portal Secure Access' : 'Welcome to Pavitra B2B'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isAdminMode ? 'Authorized personnel only' : 'Select your account profile to proceed'}
        </p>
      </div>

      {isAdminMode ? (
        /* Admin Login Form */
        <form onSubmit={handleAdminLogin} className="space-y-4">
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
            className="w-full bg-[#482922] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#351e19] transition shadow"
          >
            Authenticate Admin
          </button>

          <button 
            type="button"
            onClick={() => setIsAdminMode(false)}
            className="w-full text-xs text-gray-500 hover:text-gray-800 text-center mt-2"
          >
            ← Back to regular login
          </button>
        </form>
      ) : (
        /* Regular User Login */
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email / Phone</label>
            <input type="text" placeholder="Enter registered business credentials" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password / OTP</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#482922]" />
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Login as:</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setUserRole('retailer'); setCurrentView('retailer-dash'); }}
                className="py-2.5 px-4 rounded-xl border-2 border-[#482922] text-[#482922] font-semibold text-sm hover:bg-[#482922] hover:text-white transition text-center"
              >
                Retailer Buyer
              </button>
              <button 
                onClick={() => { setUserRole('seller'); setCurrentView('seller-dash'); }}
                className="py-2.5 px-4 rounded-xl border-2 border-[#482922] text-[#482922] font-semibold text-sm hover:bg-[#482922] hover:text-white transition text-center"
              >
                Weaver / Seller
              </button>
            </div>
          </div>

          {/* Discreet Admin Login Trigger */}
          <div className="pt-6 border-t border-gray-100 text-center">
            <button 
              onClick={() => setIsAdminMode(true)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#482922] transition font-medium"
            >
              <ShieldAlert size={14} />
              <span>System Administrator Login</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}