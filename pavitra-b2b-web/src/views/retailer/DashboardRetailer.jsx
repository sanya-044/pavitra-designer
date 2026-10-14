import React, { useState, useEffect } from 'react';
import { orderApi, authStorage } from '../../services/api';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function RetailerDashboard({ setCurrentView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authStorage.getUser();

  useEffect(() => {
    const fetchRetailerOrders = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getMyOrders();
        if (res.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchRetailerOrders();
  }, []);

  const totalSareesOrdered = orders.reduce((acc, o) => acc + (o.totalUnits || 0), 0);
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const estimatedTaxCredit = orders.reduce((acc, o) => acc + (o.taxAmount || 0), 0);

  const verificationBadge = user?.businessVerificationStatus === 'verified'
    ? { text: 'Verified Retailer', bg: 'bg-green-100 text-green-800' }
    : { text: 'GST Unverified', bg: 'bg-amber-100 text-amber-800' };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E0D8C0] flex justify-between items-center shadow-sm">
        <div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${verificationBadge.bg}`}>
            {verificationBadge.text}
          </span>
          <h2 className="text-2xl font-bold text-[#482922] mt-2">Retailer Dashboard</h2>
          <p className="text-sm text-gray-600">
            Welcome, {user?.name || 'Retailer'}. Manage your bulk saree orders, GST invoices, and shipment tracking.
          </p>
        </div>
        <button 
          onClick={() => setCurrentView('catalog')} 
          className="bg-[#482922] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:bg-[#351e19]"
        >
          Browse New Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">Active Orders</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">
            {activeOrders.length} Batches
          </h3>
          <span className="text-xs text-amber-600 mt-2 block">
            {activeOrders.length > 0 ? 'Fulfillment in progress' : 'No active dispatches'}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">Total Saree Units Ordered</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">
            {totalSareesOrdered} pcs
          </h3>
          <span className="text-xs text-green-600 mt-2 block">
            Across {orders.length} Wholesale Orders
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">GST Credit Available</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">
            ₹{estimatedTaxCredit.toLocaleString('en-IN')}
          </h3>
          <span className="text-xs text-gray-500 mt-2 block">Verified 5% tax input</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
          <h3 className="font-bold text-stone-900">Your Wholesale Order History</h3>
          <span className="text-xs text-stone-500 font-semibold">{orders.length} orders total</span>
        </div>

        {loading ? (
          <div className="py-12 text-center flex items-center justify-center gap-2 text-stone-500">
            <Loader2 size={18} className="animate-spin text-amber-950" />
            <span className="text-sm">Loading order history...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-sm space-y-2">
            <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No bulk orders placed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Total Units</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((ord) => (
                  <tr key={ord.id || ord._id} className="hover:bg-stone-50/50">
                    <td className="p-4 font-bold text-amber-950">{ord.orderNumber}</td>
                    <td className="p-4">{ord.totalUnits} pieces</td>
                    <td className="p-4 font-extrabold text-stone-900">
                      ₹{Number(ord.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-amber-100 text-amber-900">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-stone-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
