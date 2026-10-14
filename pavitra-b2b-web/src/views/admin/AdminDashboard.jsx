import React, { useState, useEffect } from 'react';
import { adminApi, productApi } from '../../services/api';
import AdminOverview from './AdminOverview';
import AdminOrders from './AdminOrders';
import AdminCatalog from './AdminCatalog';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard({ sarees = [], setSarees }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getOrders(),
        productApi.getProducts({ limit: 50 })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.orders) {
        // Map backend orders to format expected by AdminOrders.jsx
        const mappedOrders = ordersRes.value.data.orders.map((o) => ({
          id: o.orderNumber,
          retailer: o.retailerName || o.retailer?.businessName || o.retailer?.name || 'Retailer',
          items: `${o.totalUnits} sarees (${o.items?.length || 0} batches)`,
          total: o.formattedGrandTotal || `₹${Number(o.grandTotal).toLocaleString('en-IN')}`,
          status: o.status === 'confirmed' ? 'Confirmed' : o.status === 'in_production' ? 'In Production' : o.status === 'delivered' ? 'Delivered' : o.status,
          date: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
        }));
        setOrders(mappedOrders);
      }

      if (productsRes.status === 'fulfilled' && productsRes.value?.data?.products && setSarees) {
        setSarees(productsRes.value.data.products);
      }
    } catch {
      // Ignore or let fallback handle gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Admin Control Portal</h1>
          <p className="text-sm text-stone-500">
            Manage platform catalog, monitor wholesale orders, and view live marketplace analytics.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-amber-950 text-white shadow'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-amber-950 text-white shadow'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-amber-950 text-white shadow'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Manage Catalog ({sarees.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center flex items-center justify-center gap-2 text-stone-500">
          <Loader2 size={20} className="animate-spin text-amber-950" />
          <span className="text-sm">Connecting to Pavitra Admin backend services...</span>
        </div>
      )}

      {/* Tab Content Render */}
      {!loading && activeTab === 'overview' && (
        <AdminOverview orders={orders} sarees={sarees} stats={stats} />
      )}
      {!loading && activeTab === 'orders' && (
        <AdminOrders orders={orders} />
      )}
      {!loading && activeTab === 'catalog' && (
        <AdminCatalog sarees={sarees} setSarees={setSarees} onRefresh={fetchAdminData} />
      )}
    </div>
  );
}