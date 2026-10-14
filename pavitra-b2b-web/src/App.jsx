import React, { useState, useEffect } from 'react';
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
import CheckoutScreen from './views/checkout/CheckoutScreen';
import AdminDashboard from './views/admin/AdminDashboard';
import {
  authApi,
  authStorage,
  productApi,
  cartApi,
  wishlistApi
} from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('catalog');
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Live Catalog State
  const [sarees, setSarees] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Bag & Wishlist State
  const [cart, setCart] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // 1. Initial Session Restoration
  useEffect(() => {
    const savedUser = authStorage.getUser();
    const token = authStorage.getToken();

    if (token && savedUser) {
      setUserRole(savedUser.role);
      setCurrentUser(savedUser);

      // Verify token validity in background
      authApi.getMe()
        .then((res) => {
          if (res.data?.user) {
            setUserRole(res.data.user.role);
            setCurrentUser(res.data.user);
            authStorage.setUser(res.data.user);
          }
        })
        .catch(() => {
          // Token expired or invalid
          authStorage.clearAll();
          setUserRole(null);
          setCurrentUser(null);
        });
    }
  }, []);

  // 2. Fetch Live Saree Catalog from Backend
  const loadCatalog = async (category = selectedCategory, q = searchQuery) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await productApi.getProducts({
        category: category !== 'All' ? category : undefined,
        q: q.trim() || undefined,
        limit: 50
      });
      if (res.data?.products) {
        setSarees(res.data.products);
      }
    } catch (err) {
      setCatalogError(err.message || 'Failed to fetch catalog from backend');
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearch = (q) => {
    loadCatalog(selectedCategory, q);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
  };

  // 3. Fetch User's Cart and Wishlist if Authenticated
  const loadCartAndWishlist = async () => {
    if (!authStorage.getToken()) {
      setCart([]);
      setWishlist([]);
      setCartSummary(null);
      return;
    }

    // Load Cart
    setCartLoading(true);
    try {
      const res = await cartApi.getCart();
      if (res.data?.cart) {
        setCart(res.data.cart.items || []);
        setCartSummary(res.data.cart);
      }
    } catch {
      // Ignored if user unauthenticated or network failure
    } finally {
      setCartLoading(false);
    }

    // Load Wishlist
    setWishlistLoading(true);
    try {
      const res = await wishlistApi.getWishlist();
      if (res.data?.wishlist?.products) {
        setWishlist(res.data.wishlist.products);
      }
    } catch {
      // Ignored
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    loadCartAndWishlist();
  }, [userRole]);

  // 4. Cart Operations
  const addToCart = async (saree) => {
    if (!authStorage.getToken()) {
      alert('Please log in or register to add wholesale sarees to your B2B Inquiry Bag.');
      setCurrentView('auth');
      return;
    }

    const productId = saree.id || saree._id;
    const moq = saree.moq || 5;

    try {
      const res = await cartApi.addItem(productId, moq);
      if (res.data?.cart) {
        setCart(res.data.cart.items || []);
        setCartSummary(res.data.cart);
        alert(`Added ${saree.name} (${moq} pcs MOQ) to your B2B Inquiry Bag!`);
      }
    } catch (err) {
      alert(`Could not add to bag: ${err.message}`);
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      const res = await cartApi.updateItem(productId, quantity);
      if (res.data?.cart) {
        setCart(res.data.cart.items || []);
        setCartSummary(res.data.cart);
      }
    } catch (err) {
      alert(`Could not update quantity: ${err.message}`);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await cartApi.removeItem(productId);
      if (res.data?.cart) {
        setCart(res.data.cart.items || []);
        setCartSummary(res.data.cart);
      }
    } catch (err) {
      alert(`Could not remove item: ${err.message}`);
    }
  };

  // 5. Wishlist Operations
  const toggleWishlist = async (saree) => {
    if (!authStorage.getToken()) {
      alert('Please log in to save sarees to your wishlist.');
      setCurrentView('auth');
      return;
    }

    const productId = saree.id || saree._id;
    const isWishlisted = wishlist.some((item) => (item.id || item._id) === productId);

    try {
      if (isWishlisted) {
        await wishlistApi.removeItem(productId);
        setWishlist(wishlist.filter((item) => (item.id || item._id) !== productId));
      } else {
        await wishlistApi.addItem(productId);
        setWishlist([...wishlist, saree]);
      }
    } catch (err) {
      alert(`Wishlist action failed: ${err.message}`);
    }
  };

  // 6. Logout handler
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      authStorage.clearAll();
    }
    setUserRole(null);
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    setCartSummary(null);
    setCurrentView('catalog');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#333] font-sans flex flex-col">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        userRole={userRole} 
        setUserRole={setUserRole} 
        onLogout={handleLogout}
        cartCount={cartSummary?.totalUnits || cart.length} 
        wishlistCount={wishlist.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentView === 'catalog' && (
          <CatalogScreen 
            sarees={sarees}
            loading={catalogLoading}
            error={catalogError}
            addToCart={addToCart} 
            wishlist={wishlist} 
            toggleWishlist={toggleWishlist}
            onSearch={handleSearch}
            onCategoryChange={handleCategoryChange}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
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
            cartSummary={cartSummary}
            loading={cartLoading}
            updateQuantity={updateCartQuantity}
            removeFromCart={removeFromCart} 
            setCurrentView={setCurrentView} 
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutScreen
            cart={cart}
            setCurrentView={setCurrentView}
            onOrderPlaced={() => {
              loadCartAndWishlist();
            }}
          />
        )}

        {currentView === 'admin-dash' && (
          <AdminDashboard 
            sarees={sarees} 
            setSarees={setSarees} 
          />
        )}

        {currentView === 'auth' && (
          <AuthScreen 
            setUserRole={setUserRole} 
            setCurrentView={setCurrentView}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              loadCartAndWishlist();
            }}
          />
        )}

        {currentView === 'retailer-dash' && (
          <RetailerDashboard setCurrentView={setCurrentView} />
        )}

        {currentView === 'seller-dash' && (
          <SellerDashboard setCurrentView={setCurrentView} />
        )}

        {currentView === 'delivery' && (
          <DeliveryTracking />
        )}

        {currentView === 'support' && (
          <SupportScreen />
        )}
      </main>

      <Footer />
    </div>
  );
}