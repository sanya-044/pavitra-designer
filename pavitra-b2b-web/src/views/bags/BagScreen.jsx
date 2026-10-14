import React from 'react';
import { ShoppingBag, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function BagScreen({
  cart = [],
  cartSummary = null,
  loading = false,
  error = null,
  updateQuantity,
  removeFromCart,
  setCurrentView
}) {
  const totalItems = cartSummary?.totalUnits || cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotalDisplay = cartSummary?.formattedSubtotal || 'Calculated at checkout';
  const taxDisplay = cartSummary?.formattedTax || '5% GST Included on Checkout';
  const grandTotalDisplay = cartSummary?.formattedGrandTotal || subtotalDisplay;

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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-950" />
          <p className="text-sm text-stone-500">Updating bulk inquiry bag...</p>
        </div>
      ) : cart.length === 0 ? (
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
            {cart.map((item) => {
              const productId = item.product?._id || item.product?.id || item.id;
              const title = item.product?.name || item.name;
              const origin = item.product?.origin || item.origin;
              const moq = item.product?.moq || item.moq || 5;
              const price = item.product?.formattedPrice || item.price;
              const image = item.product?.image || item.image;
              const quantity = item.quantity || 1;

              return (
                <div key={productId} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
                  <img src={image} alt={title} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-amber-900">{origin}</span>
                    <h3 className="font-bold text-stone-900 text-sm">{title}</h3>
                    <p className="text-xs text-stone-500">Minimum Order Quantity (MOQ): {moq} pcs</p>
                    <p className="text-sm font-extrabold text-stone-900 mt-1">{price}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {updateQuantity ? (
                      <div className="flex items-center gap-1 border border-stone-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(productId, Math.max(1, quantity - 1))}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 rounded text-sm font-bold"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(productId, quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 rounded text-sm font-bold"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold bg-stone-100 px-3 py-1 rounded-lg">Qty: {quantity}</span>
                    )}

                    <button 
                      onClick={() => removeFromCart(productId)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
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
                <span>Total Units:</span>
                <span className="font-semibold text-stone-900">{totalItems} pcs</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Subtotal (Server Calculated):</span>
                <span className="font-bold text-stone-900">{subtotalDisplay}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST Tax (5% Wholesale):</span>
                <span className="font-semibold text-stone-900">{taxDisplay}</span>
              </div>
              <div className="flex justify-between text-stone-900 border-t pt-3 font-extrabold text-base">
                <span>Grand Total:</span>
                <span className="text-amber-950">{grandTotalDisplay}</span>
              </div>
            </div>

            <button 
              onClick={() => setCurrentView('checkout')}
              className="w-full bg-amber-950 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-900 transition shadow"
            >
              Proceed to Wholesale Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}