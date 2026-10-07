import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistScreen({ wishlist = [], toggleWishlist, addToCart, setCurrentView }) {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">My Saved Wishlist</h1>
          <p className="text-sm text-stone-500">Manage your favorite handloom sarees for future bulk orders.</p>
        </div>
        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">
          {wishlist.length} Items Saved
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
          <Heart className="w-16 h-16 text-stone-300 mx-auto" />
          <h2 className="text-lg font-bold text-stone-800">Your wishlist is empty</h2>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">Explore our extensive weaver catalog and tap the heart icon on any saree to save it here.</p>
          <button 
            onClick={() => setCurrentView('catalog')}
            className="mt-4 bg-amber-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-900 transition"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {wishlist.map((saree) => (
            <div key={saree.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col relative group">
              <button 
                onClick={() => toggleWishlist(saree)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white text-red-500 transition"
                title="Remove from Wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="h-64 overflow-hidden bg-stone-100 relative">
                <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                  MOQ: {saree.moq}
                </span>
                <img src={saree.image} alt={saree.name} className="w-full h-full object-cover" />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-semibold text-amber-900">{saree.origin}</span>
                  <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{saree.name}</h3>
                  <p className="text-lg font-extrabold text-stone-900 mt-1">{saree.price}</p>
                </div>

                <button 
                  onClick={() => {
                    addToCart(saree);
                    toggleWishlist(saree); // Optionally move to bag or keep in wishlist
                  }}
                  className="w-full bg-amber-950 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-900 transition"
                >
                  <ShoppingBag className="w-4 h-4" /> Move to Inquiry Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}