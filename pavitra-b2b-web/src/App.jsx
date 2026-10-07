 import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CatalogScreen from './views/catalog/CatalogScreen';
import AuthScreen from './views/auth/AuthScreen';
import RetailerDashboard from './views/retailer/DashboardRetailer';
import SellerDashboard from './views/seller/SellerDashboard';
import DeliveryTracking from './views/delivery/DeliveryTracking';
import SupportScreen from './views/support/SupportScreen';
import WishlistScreen from './views/wishlist/WishlistScreen';
import BagScreen from './views/bags/BagScreen';
import AdminDashboard from './views/admin/AdminDashboard'; // Import Modular Admin Dashboard

export default function App() {
  const [currentView, setCurrentView] = useState('catalog');
  const [userRole, setUserRole] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Centralized Sarees Catalog State for Admin & User sync
  const [sarees, setSarees] = useState([
    { id: 1, name: 'Royal Banarasi Katan Silk Saree', category: 'Banarasi', moq: '5 pcs', price: '₹4,500/pc', rating: 4.8, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600', origin: 'Varanasi' },
    { id: 2, name: 'Traditional Kanchipuram Zari Brocade', category: 'Kanchipuram', moq: '3 pcs', price: '₹6,200/pc', rating: 4.9, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', origin: 'Tamil Nadu' },
    { id: 3, name: 'Handloom Chanderi Cotton Silk', category: 'Chanderi', moq: '10 pcs', price: '₹2,800/pc', rating: 4.6, image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600', origin: 'Madhya Pradesh' },
    { id: 4, name: 'Designer Organza Floral Print Saree', category: 'Organza', moq: '5 pcs', price: '₹3,400/pc', rating: 4.7, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600', origin: 'Surat' }
  ]);

  const addToCart = (saree) => {
    if (!cart.some((item) => item.id === saree.id)) {
      setCart([...cart, { ...saree, quantity: 1 }]);
      alert(`Added ${saree.name} to your B2B Inquiry Bag!`);
    } else {
      alert(`Item is already in your bag.`);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const toggleWishlist = (saree) => {
    if (wishlist.some((item) => item.id === saree.id)) {
      setWishlist(wishlist.filter((item) => item.id !== saree.id));
    } else {
      setWishlist([...wishlist, saree]);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#333] font-sans flex flex-col">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        userRole={userRole} 
        setUserRole={setUserRole} 
        cartCount={cart.length} 
        wishlistCount={wishlist.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentView === 'catalog' && (
          <CatalogScreen 
            sarees={sarees}
            addToCart={addToCart} 
            wishlist={wishlist} 
            toggleWishlist={toggleWishlist} 
          />
        )}
        {currentView === 'wishlist' && (
          <WishlistScreen 
            wishlist={wishlist} 
            toggleWishlist={toggleWishlist} 
            addToCart={addToCart} 
            setCurrentView={setCurrentView} 
          />
        )}
        {currentView === 'bag' && (
          <BagScreen 
            cart={cart} 
            removeFromCart={removeFromCart} 
            setCurrentView={setCurrentView} 
          />
        )}
        {currentView === 'admin-dash' && (
          <AdminDashboard 
            sarees={sarees} 
            setSarees={setSarees} 
          />
        )}
        {currentView === 'auth' && <AuthScreen setUserRole={setUserRole} setCurrentView={setCurrentView} />}
        {currentView === 'retailer-dash' && <RetailerDashboard setCurrentView={setCurrentView} />}
        {currentView === 'seller-dash' && <SellerDashboard sarees={sarees} setSarees={setSarees} />}
        {currentView === 'delivery' && <DeliveryTracking />}
        {currentView === 'support' && <SupportScreen />}
      </main>

      <Footer />
    </div>
  );
}