import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, Search, Filter, Loader2, AlertCircle } from 'lucide-react';

export default function CatalogScreen({
  sarees = [],
  loading = false,
  error = null,
  addToCart,
  wishlist = [],
  toggleWishlist,
  onSearch,
  onCategoryChange,
  selectedCategory = 'All',
  searchQuery = '',
  setSearchQuery
}) {
  const categories = ['All', 'Banarasi', 'Kanchipuram', 'Chanderi', 'Organza', 'Silk', 'Cotton'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleCatSelect = (cat) => {
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative bg-amber-950 rounded-3xl p-8 md:p-12 text-white shadow-xl overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
            Direct Weaver Wholesale
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Authentic Handloom Sarees at Direct Mill Prices
          </h1>
          <p className="text-stone-300 text-sm md:text-base">
            Connect directly with verified weavers across Banaras, Kanchipuram, and Surat. Bulk orders with assured quality & GST invoices.
          </p>
        </div>
      </div>

      {/* Search and Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-800 text-lg">
            Saree Catalog {sarees && `(${sarees.length})`}
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search sarees or weavers..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
          />
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCatSelect(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-950 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-950" />
            <p className="text-sm text-stone-500 font-medium">Fetching wholesale saree inventory from artisan looms...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-800 max-w-lg mx-auto space-y-2">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-sm">Failed to load catalog</h3>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sarees.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <p className="text-base font-bold text-stone-800">No sarees found matching your criteria</p>
            <p className="text-xs text-stone-500">Try adjusting your search terms or filter selections.</p>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && !error && sarees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {sarees.map((saree) => {
              const sareeId = saree.id || saree._id;
              const isWishlisted = wishlist.some((item) => (item.id || item._id) === sareeId);

              // Formatted price handling
              const priceDisplay = saree.formattedPrice || (typeof saree.price === 'number' ? `₹${saree.price.toLocaleString('en-IN')}/pc` : saree.price);
              const moqDisplay = saree.formattedMoq || (saree.moq ? `${saree.moq} pcs` : '5 pcs');

              return (
                <div key={sareeId} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow">
                  <button 
                    onClick={() => toggleWishlist(saree)}
                    className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition-transform active:scale-95"
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-600'}`} />
                  </button>

                  <div className="h-72 overflow-hidden bg-stone-100 relative">
                    <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                      MOQ: {moqDisplay}
                    </span>
                    <img 
                      src={saree.image} 
                      alt={saree.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                        <span className="font-medium text-amber-900">{saree.origin}</span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-600" /> {saree.rating || 4.8}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{saree.name}</h3>
                      <p className="text-lg font-extrabold text-stone-900 mt-1">{priceDisplay}</p>
                    </div>

                    <button 
                      onClick={() => addToCart(saree)}
                      className="w-full bg-amber-950 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-900 transition-colors shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Bag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}