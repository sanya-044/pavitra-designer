 import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, Search, Filter } from 'lucide-react';

export default function CatalogScreen({ addToCart, wishlist = [], toggleWishlist }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const sarees = [
    { id: 1, name: 'Royal Banarasi Katan Silk Saree', category: 'Banarasi', moq: '5 pcs', price: '₹4,500/pc', rating: 4.8, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600', origin: 'Varanasi' },
    { id: 2, name: 'Traditional Kanchipuram Zari Brocade', category: 'Kanchipuram', moq: '3 pcs', price: '₹6,200/pc', rating: 4.9, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', origin: 'Tamil Nadu' },
    { id: 3, name: 'Handloom Chanderi Cotton Silk', category: 'Chanderi', moq: '10 pcs', price: '₹2,800/pc', rating: 4.6, image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600', origin: 'Madhya Pradesh' },
    { id: 4, name: 'Designer Organza Floral Print Saree', category: 'Organza', moq: '5 pcs', price: '₹3,400/pc', rating: 4.7, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600', origin: 'Surat' },
    { id: 5, name: 'Zari Woven Tissue Silk Banarasi', category: 'Banarasi', moq: '5 pcs', price: '₹5,500/pc', rating: 4.9, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600', origin: 'Varanasi' },
    { id: 6, name: 'Temple Border Kanchipuram Silk', category: 'Kanchipuram', moq: '4 pcs', price: '₹7,100/pc', rating: 5.0, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', origin: 'Kanchipuram' },
    { id: 7, name: 'Chanderi Gold Foil Printed Saree', category: 'Chanderi', moq: '8 pcs', price: '₹2,400/pc', rating: 4.5, image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600', origin: 'Chanderi' },
    { id: 8, name: 'Organza Embroidered Party Wear Saree', category: 'Organza', moq: '6 pcs', price: '₹4,100/pc', rating: 4.7, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600', origin: 'Surat' }
  ];

  const categories = ['All', 'Banarasi', 'Kanchipuram', 'Chanderi', 'Organza'];

  const filteredSarees = sarees.filter((saree) => {
    const matchesCategory = selectedCategory === 'All' || saree.category === selectedCategory;
    const matchesSearch = saree.name.toLowerCase().includes(searchQuery.toLowerCase()) || saree.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <span className="font-bold text-stone-800 text-lg">Saree Catalog ({sarees.length})</span>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search sarees or weavers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
          />
        </div>
      </div>

      {/* CATALOG VIEW */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${selectedCategory === cat ? 'bg-amber-950 text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredSarees.map((saree) => {
            const isWishlisted = wishlist.some((item) => item.id === saree.id);
            return (
              <div key={saree.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow">
                <button 
                  onClick={() => toggleWishlist(saree)}
                  className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition-transform active:scale-95"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-600'}`} />
                </button>

                <div className="h-72 overflow-hidden bg-stone-100 relative">
                  <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                    MOQ: {saree.moq}
                  </span>
                  <img src={saree.image} alt={saree.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                      <span className="font-medium text-amber-900">{saree.origin}</span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold"><Star className="w-3.5 h-3.5 fill-amber-600" /> {saree.rating}</span>
                    </div>
                    <h3 className="font-bold text-stone-800 text-sm line-click-1">{saree.name}</h3>
                    <p className="text-lg font-extrabold text-stone-900 mt-1">{saree.price}</p>
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
      </div>
    </div>
  );
}