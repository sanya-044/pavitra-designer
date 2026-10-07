import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function SupportScreen() {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E0D8C0] p-8 shadow-sm text-center">
      <div className="w-12 h-12 bg-[#F5EEDC] text-[#482922] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <HelpCircle size={24} />
      </div>
      <h2 className="text-xl font-bold text-[#482922]">Pavitra B2B Wholesale Support</h2>
      <p className="text-xs text-gray-500 mt-1 mb-6">Need assistance with bulk orders, customized weaving, or logistics claims?</p>
      <div className="bg-[#FFFDF5] p-4 rounded-xl border border-[#E0D8C0] text-sm text-left space-y-2">
        <p><strong>Wholesale Helpline:</strong> +91 98765 43210</p>
        <p><strong>Email Support:</strong> support@pavitrabb.com</p>
        <p><strong>Business Hours:</strong> Monday - Saturday (9:00 AM - 7:00 PM IST)</p>
      </div>
    </div>
  );
}