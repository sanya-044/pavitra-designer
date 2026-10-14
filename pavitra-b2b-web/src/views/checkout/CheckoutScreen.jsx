import React, { useState } from 'react';
import { orderApi } from '../../services/api';
import { ShieldCheck, Truck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutScreen({ cart = [], onOrderPlaced, setCurrentView }) {
  const [addressLine, setAddressLine] = useState('Shop 42, Heritage Zari Market, MG Road');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('411001');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderPayload = {
        shippingAddress: {
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        },
        notes: notes.trim() || undefined,
        idempotencyKey: `ord-checkout-${Date.now()}`
      };

      const res = await orderApi.createOrder(orderPayload);
      setPlacedOrder(res.data.order);
      if (onOrderPlaced) onOrderPlaced(res.data.order);
    } catch (err) {
      setError(err.message || 'Failed to submit B2B wholesale order.');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center space-y-4 my-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">B2B Wholesale Order Confirmed!</h2>
        <p className="text-sm text-stone-600">
          Order Reference: <span className="font-bold text-amber-950">{placedOrder.orderNumber}</span>
        </p>
        <div className="bg-stone-50 p-4 rounded-xl text-left text-xs space-y-2 border border-stone-200">
          <p><strong>Total Units:</strong> {placedOrder.totalUnits} sarees</p>
          <p><strong>Subtotal:</strong> ₹{Number(placedOrder.subtotal).toLocaleString('en-IN')}</p>
          <p><strong>GST (5%):</strong> ₹{Number(placedOrder.taxAmount).toLocaleString('en-IN')}</p>
          <p className="text-sm font-bold border-t pt-1">
            <strong>Grand Total:</strong> ₹{Number(placedOrder.grandTotal).toLocaleString('en-IN')}
          </p>
          <p><strong>Payment Mode:</strong> B2B Credit Invoice / Bank NEFT</p>
          <p><strong>Destination:</strong> {placedOrder.shippingAddress?.addressLine}, {placedOrder.shippingAddress?.city}</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setCurrentView('retailer-dash')}
            className="flex-1 bg-amber-950 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-900 transition"
          >
            Go to Retailer Dashboard
          </button>
          <button
            onClick={() => setCurrentView('catalog')}
            className="flex-1 border border-stone-300 text-stone-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-50 transition"
          >
            Browse More Sarees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200 space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-2xl font-bold text-stone-800">B2B Wholesale Checkout</h2>
        <p className="text-xs text-stone-500 mt-1">Direct-from-loom batch procurement with GST tax credit invoice</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Summary list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-stone-700 text-sm">Selected Inquiry Items ({cart.length})</h3>
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {cart.map((item, idx) => {
            const title = item.product?.name || item.name;
            const moq = item.product?.moq || item.moq || 5;
            const price = item.product?.formattedPrice || item.price;
            const qty = item.quantity || 1;

            return (
              <div key={idx} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200 text-sm">
                <div>
                  <p className="font-medium text-stone-800">{title}</p>
                  <p className="text-xs text-stone-500">Quantity: {qty} pcs (MOQ: {moq})</p>
                </div>
                <span className="font-bold text-amber-950">{price}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping Address Form */}
      <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
        <h3 className="font-semibold text-stone-700 text-sm flex items-center gap-2">
          <Truck size={16} /> Fulfillment & Shipping Address
        </h3>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Business Premise / Address</label>
          <input
            type="text"
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
            placeholder="Shop / Showroom / Godown address"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">City</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">State</label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">6-Digit PIN</label>
            <input
              type="text"
              required
              pattern="[1-9][0-9]{5}"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
              placeholder="e.g. 411001"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Special Packaging / Transit Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-950"
            placeholder="e.g. Moisture barrier wrap requested for festive stock"
          />
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <ShieldCheck size={18} className="shrink-0 text-amber-800" />
          <span>Server-verified B2B Credit Invoicing. Prices and 5% textile GST calculated on secure backend.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentView('bag')}
            className="px-6 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition"
          >
            ← Back to Bag
          </button>
          <button 
            type="submit"
            disabled={loading || cart.length === 0}
            className="flex-1 bg-amber-950 text-white py-3 rounded-xl font-semibold hover:bg-amber-900 transition-colors shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Confirm B2B Bulk Order</span>
          </button>
        </div>
      </form>
    </div>
  );
}