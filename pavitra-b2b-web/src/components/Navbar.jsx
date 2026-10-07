 import React from 'react';
import { ShoppingBag, User, Truck, HelpCircle, Store, LogOut, Heart } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, userRole, setUserRole, cartCount = 0, wishlistCount = 0 }) {
  return (
    <header className="bg-white border-b border-[#E0D8C0] sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('catalog')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#482922] to-[#1c1c1c] flex items-center justify-center text-white text-xl font-bold shadow">
          प
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#482922] leading-none">Pavitra B2B</h1>
          <span className="text-xs text-[#666]">Weaver to Retailer Marketplace</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setCurrentView('catalog')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentView === 'catalog' ? 'bg-[#482922] text-white' : 'hover:bg-gray-100'}`}
        >
          Catalog
        </button>
        
        <button 
          onClick={() => setCurrentView('delivery')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentView === 'delivery' ? 'bg-[#482922] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <Truck size={16} />
          <span>Logistics</span>
        </button>

        <button 
          onClick={() => setCurrentView('support')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentView === 'support' ? 'bg-[#482922] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <HelpCircle size={16} />
          <span>Support</span>
        </button>

        {userRole ? (
          <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
            <button 
              onClick={() => setCurrentView(userRole === 'seller' ? 'seller-dash' : 'retailer-dash')}
              className="flex items-center space-x-1 bg-[#F5EEDC] text-[#482922] px-3 py-1.5 rounded-lg text-sm font-semibold"
            >
              <Store size={16} />
              <span className="capitalize">{userRole} Dashboard</span>
            </button>
            <button 
              onClick={() => { setUserRole(null); setCurrentView('catalog'); }}
              className="text-gray-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setCurrentView('auth')}
            className="flex items-center space-x-1 bg-[#482922] text-white px-4 py-2 rounded-xl text-sm font-medium shadow hover:bg-[#351e19]"
          >
            <User size={16} />
            <span>Login / Register</span>
          </button>
        )}

        {/* Full Page Wishlist Navigation */}
        <button 
          onClick={() => setCurrentView('wishlist')}
          className={`relative cursor-pointer p-2 rounded-xl transition ${currentView === 'wishlist' ? 'bg-[#482922] text-white' : 'bg-[#F5EEDC] text-[#482922] hover:bg-[#ebdcc3]'}`}
          title="Wishlist"
        >
          <Heart size={20} className={currentView === 'wishlist' ? 'text-white fill-white' : 'text-red-500 fill-red-500'} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
        </button>

        {/* Full Page Inquiry Bag Navigation */}
        <button 
          onClick={() => setCurrentView('bag')}
          className={`relative cursor-pointer p-2 rounded-xl transition ${currentView === 'bag' ? 'bg-[#482922] text-white' : 'bg-[#F5EEDC] text-[#482922] hover:bg-[#ebdcc3]'}`}
          title="B2B Inquiry Bag"
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}