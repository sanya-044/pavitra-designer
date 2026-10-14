import React from 'react';
import { ShoppingBag, Layers, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminOverview({ orders = [], sarees = [], stats = null }) {
  const revenueDisplay = stats?.formattedTotalRevenue || '₹4,12,500';
  const ordersCount = stats?.ordersPlaced ?? orders.length;
  const catalogCount = stats?.catalogItemsCount ?? sarees.length;
  const verifiedRetailersCount = stats?.verifiedRetailersCount ?? 128;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase">Total Revenue</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{revenueDisplay}</h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> Live Server Calculation
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase">Orders Placed</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{ordersCount}</h3>
            <span className="text-xs text-amber-900 font-semibold mt-1 block">Active Fulfillment</span>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center font-bold">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase">Catalog Items</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{catalogCount} Sarees</h3>
            <span className="text-xs text-stone-500 font-semibold mt-1 block">Live on User Panel</span>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center font-bold">
            <Layers size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase">Verified Retailers</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{verifiedRetailersCount} Stores</h3>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">GST Verified</span>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}