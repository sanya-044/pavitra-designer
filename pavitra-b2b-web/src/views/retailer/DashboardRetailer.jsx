import React from 'react';

export default function RetailerDashboard({ setCurrentView }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E0D8C0] flex justify-between items-center shadow-sm">
        <div>
          <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full">Verified Retailer</span>
          <h2 className="text-2xl font-bold text-[#482922] mt-2">Retailer Dashboard</h2>
          <p className="text-sm text-gray-600">Manage your bulk saree orders, GST invoices, and shipment tracking.</p>
        </div>
        <button onClick={() => setCurrentView('catalog')} className="bg-[#482922] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow">
          Browse New Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">Active Orders</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">3 Batches</h3>
          <span className="text-xs text-amber-600 mt-2 block">In Transit from Varanasi</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">Total Saree Units Ordered</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">125 pcs</h3>
          <span className="text-xs text-green-600 mt-2 block">Across 4 Weavers</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E0D8C0]">
          <span className="text-xs text-gray-500 font-semibold">GST Credit Available</span>
          <h3 className="text-3xl font-extrabold text-[#482922] mt-1">₹14,850</h3>
          <span className="text-xs text-gray-500 mt-2 block">Verified tax input</span>
        </div>
      </div>
    </div>
  );
}
