 import React from 'react';

export default function AdminOrders({ orders = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-stone-200">
        <h2 className="font-bold text-lg text-stone-900">Retailer Bulk Orders</h2>
        <p className="text-sm text-stone-500">Monitor all orders placed through the B2B portal.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 text-stone-600 text-xs uppercase font-semibold border-b border-stone-200">
              <th className="p-4">Order ID</th>
              <th className="p-4">Retailer Name</th>
              <th className="p-4">Items Ordered</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm text-stone-800">
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-stone-50/50">
                <td className="p-4 font-bold text-amber-950">{ord.id}</td>
                <td className="p-4 font-medium">{ord.retailer}</td>
                <td className="p-4 text-stone-600">{ord.items}</td>
                <td className="p-4 font-extrabold">{ord.total}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ord.status === 'Confirmed' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                    {ord.status}
                  </span>
                </td>
                <td className="p-4 text-stone-500 text-xs">{ord.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}