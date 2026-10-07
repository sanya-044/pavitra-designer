import React from 'react';
import { Plus } from 'lucide-react';

export default function SellerDashboard() {
  const sarees = [
    { id: 1, name: "Royal Banarasi Katan Silk Saree", price: 4500, moq: 5, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Traditional Kanchipuram Zari Brocade", price: 6200, moq: 3, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E0D8C0] flex justify-between items-center shadow-sm">
        <div>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">Verified Weaver / Mill</span>
          <h2 className="text-2xl font-bold text-[#482922] mt-2">Weaver Inventory Management</h2>
          <p className="text-sm text-gray-600">List new saree designs, manage stock availability, and fulfill wholesale requests.</p>
        </div>
        <button className="bg-[#482922] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1 shadow">
          <Plus size={16} />
          <span>Add New Saree Listing</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0D8C0] p-6">
        <h3 className="font-bold text-[#482922] mb-4">Your Active Bulk Catalog Listings</h3>
        <div className="space-y-3">
          {sarees.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <img src={s.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <h4 className="font-bold text-sm">{s.name}</h4>
                  <span className="text-xs text-gray-500">MOQ: {s.moq} pcs | ₹{s.price}/pc</span>
                </div>
              </div>
              <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg">Active Stock</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}