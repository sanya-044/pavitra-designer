import React, { useState, useEffect } from 'react';
import { sellerApi } from '../../services/api';
import { Plus, Loader2 } from 'lucide-react';

export default function SellerDashboard({ setCurrentView }) {
  const [sellerProducts, setSellerProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);
      try {
        const [statsRes, productsRes] = await Promise.allSettled([
          sellerApi.getStats(),
          sellerApi.getProducts()
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setStats(statsRes.value.data);
        }
        if (productsRes.status === 'fulfilled' && productsRes.value?.data?.products) {
          setSellerProducts(productsRes.value.data.products);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, []);

  const verificationBadge = stats?.verificationStatus === 'verified'
    ? { text: 'Verified Weaver / Mill', bg: 'bg-green-100 text-green-800' }
    : stats?.verificationStatus === 'pending'
    ? { text: 'Verification Pending Review', bg: 'bg-amber-100 text-amber-800' }
    : { text: 'Unverified Weaver', bg: 'bg-stone-100 text-stone-700' };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E0D8C0] flex justify-between items-center shadow-sm">
        <div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${verificationBadge.bg}`}>
            {verificationBadge.text}
          </span>
          <h2 className="text-2xl font-bold text-[#482922] mt-2">Weaver Inventory Management</h2>
          <p className="text-sm text-gray-600">List new saree designs, manage stock availability, and fulfill wholesale requests.</p>
        </div>
        <button 
          onClick={() => alert('Opening Add Saree dialog...')}
          className="bg-[#482922] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1 shadow hover:bg-[#351e19]"
        >
          <Plus size={16} />
          <span>Add New Saree Listing</span>
        </button>
      </div>

      {/* Seller Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-semibold">Total Wholesale Revenue</span>
            <p className="text-xl font-extrabold text-stone-900 mt-1">{stats.formattedTotalRevenue}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-semibold">Units Sold</span>
            <p className="text-xl font-extrabold text-stone-900 mt-1">{stats.totalUnitsSold} pieces</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-semibold">Active Inquiries</span>
            <p className="text-xl font-extrabold text-stone-900 mt-1">{stats.pendingInquiriesCount} quotation requests</p>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-[#E0D8C0] p-6">
        <h3 className="font-bold text-[#482922] mb-4">
          Your Active Bulk Catalog Listings ({sellerProducts.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center flex items-center justify-center gap-2 text-stone-500">
            <Loader2 size={18} className="animate-spin text-amber-950" />
            <span className="text-sm">Loading loom listings...</span>
          </div>
        ) : sellerProducts.length === 0 ? (
          <div className="py-8 text-center text-stone-500 text-sm">
            No sarees listed yet for your weaver account. Click "Add New Saree Listing" to publish.
          </div>
        ) : (
          <div className="space-y-3">
            {sellerProducts.map((s) => {
              const id = s.id || s._id;
              const price = s.formattedPrice || (typeof s.price === 'number' ? `₹${s.price.toLocaleString('en-IN')}/pc` : s.price);
              const moq = s.formattedMoq || `${s.moq} pcs`;

              return (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <img src={s.image} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-sm">{s.name}</h4>
                      <span className="text-xs text-gray-500">MOQ: {moq} | {price}</span>
                    </div>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg">
                    Active Stock ({s.stock || 50} pcs)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}