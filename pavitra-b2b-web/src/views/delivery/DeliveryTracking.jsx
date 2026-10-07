import React from 'react';
import { Truck } from 'lucide-react';

export default function DeliveryTracking() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E0D8C0] p-8 shadow-sm">
      <h2 className="text-xl font-bold text-[#482922] mb-2 flex items-center space-x-2">
        <Truck size={24} />
        <span>B2B Logistics & Shipment Status</span>
      </h2>
      <p className="text-xs text-gray-500 mb-6">Track insured wholesale freight batches across state borders.</p>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#482922]">Batch #PV-88321</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded">In Transit</span>
          </div>
          <p className="text-sm font-semibold">Route: Varanasi Loom Cluster → Delhi Central Hub</p>
          <p className="text-xs text-gray-500 mt-1">Estimated Delivery: Oct 9, 2026 • 50 Katan Silk Sarees</p>
        </div>
      </div>
    </div>
  );
}