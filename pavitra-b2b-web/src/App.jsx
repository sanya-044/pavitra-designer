 import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CatalogScreen from './views/catalog/CatalogScreen';
import AuthScreen from './views/auth/AuthScreen';
import RetailerDashboard from './views/retailer/DashboardRetailer';
import SellerDashboard from './views/seller/SellerDashboard';
import DeliveryTracking from './views/delivery/DeliveryTracking';
import SupportScreen from './views/support/SupportScreen';
import WishlistScreen from './views/wishlist/WishlistScreen'; // Import full wishlist page
import BagScreen from './views/bags/BagScreen'; // Import full bag page

export default function App() {
  const [currentView, setCurrentView] = useState('catalog');
  const [userRole, setUserRole] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

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
        {currentView === 'auth' && <AuthScreen setUserRole={setUserRole} setCurrentView={setCurrentView} />}
        {currentView === 'retailer-dash' && <RetailerDashboard setCurrentView={setCurrentView} />}
        {currentView === 'seller-dash' && <SellerDashboard />}
        {currentView === 'delivery' && <DeliveryTracking />}
        {currentView === 'support' && <SupportScreen />}
      </main>

      <Footer />
    </div>
  );
}