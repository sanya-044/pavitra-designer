 import React, { useState } from 'react';
import AdminOverview from './AdminOverview';
import AdminOrders from './AdminOrders';
import AdminCatalog from './AdminCatalog';

export default function AdminDashboard({ sarees = [], setSarees }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock Orders State
  const [orders] = useState([
    { id: 'ORD-9821', retailer: 'Varanasi Silks & Co.', items: 'Royal Banarasi Katan Silk (x5)', total: '₹22,500', status: 'Confirmed', date: '2026-10-07' },
    { id: 'ORD-9822', retailer: 'Kanchi Elite Fabrics', items: 'Traditional Kanchipuram Zari (x3)', total: '₹18,600', status: 'Shipped', date: '2026-10-06' }
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Admin Control Portal</h1>
          <p className="text-sm text-stone-500">Manage platform catalog, monitor wholesale orders, and view marketplace analytics.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'overview' ? 'bg-amber-950 text-white shadow' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'orders' ? 'bg-amber-950 text-white shadow' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'catalog' ? 'bg-amber-950 text-white shadow' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Manage Catalog ({sarees.length})
          </button>
        </div>
      </div>

      {/* Tab Content Render */}
      {activeTab === 'overview' && <AdminOverview orders={orders} sarees={sarees} />}
      {activeTab === 'orders' && <AdminOrders orders={orders} />}
      {activeTab === 'catalog' && <AdminCatalog sarees={sarees} setSarees={setSarees} />}
    </div>
  );
}