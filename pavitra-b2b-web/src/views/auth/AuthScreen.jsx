import React from 'react';

export default function AuthScreen({ setUserRole, setCurrentView }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#E0D8C0] p-8 shadow-sm mt-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#482922] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow">
          प
        </div>
        <h2 className="text-xl font-bold text-[#482922]">Welcome to Pavitra B2B</h2>
        <p className="text-xs text-gray-500 mt-1">Select your account profile to proceed</p>
      </div>

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
      </div>
    </div>
  );
}