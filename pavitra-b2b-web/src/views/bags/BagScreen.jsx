import React from 'react';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export default function BagScreen({ cart = [], removeFromCart, setCurrentView }) {
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">B2B Bulk Inquiry Bag</h1>
          <p className="text-sm text-stone-500">Review your selected weaver inventory before submitting a wholesale inquiry.</p>
        </div>
        <span className="bg-amber-950 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          {totalItems} Total Pieces
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
          <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto" />
          <h2 className="text-lg font-bold text-stone-800">Your inquiry bag is empty</h2>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">Add wholesale sarees from the catalog to submit your direct mill order inquiry.</p>
          <button 
            onClick={() => setCurrentView('catalog')}
            className="mt-4 bg-amber-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-900 transition"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-amber-900">{item.origin}</span>
                  <h3 className="font-bold text-stone-900 text-sm">{item.name}</h3>
                  <p className="text-xs text-stone-500">Minimum Order Quantity (MOQ): {item.moq}</p>
                  <p className="text-sm font-extrabold text-stone-900 mt-1">{item.price}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold bg-stone-100 px-3 py-1 rounded-lg">Qty: {item.quantity || 1}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-6">
            <h3 className="font-bold text-lg text-stone-900 border-b pb-3">Inquiry Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Selected Products:</span>
                <span className="font-semibold text-stone-900">{cart.length} items</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Direct Mill Pricing:</span>
                <span className="font-semibold text-emerald-600">Applied</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST Tax Invoice:</span>
                <span className="font-semibold text-stone-900">Included on Checkout</span>
              </div>
            </div>

            <button 
              onClick={() => alert('Proceeding to Secure B2B Checkout & GST Verification backend API...')}
              className="w-full bg-amber-950 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-900 transition shadow"
            >
              Proceed to Secure Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}