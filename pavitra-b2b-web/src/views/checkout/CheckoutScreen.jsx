 import React, { useState } from 'react';

export default function CheckoutScreen({ cart, setCurrentView }) {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">B2B Wholesale Checkout</h2>
      
      {/* Order Summary list */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-stone-700">Inquiry Items ({cart.length})</h3>
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center border-b pb-3 text-sm">
            <div>
              <p className="font-medium text-stone-800">{item.name}</p>
              <p className="text-stone-500">MOQ: {item.moq}</p>
            </div>
            <span className="font-semibold">{item.price}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => alert('Order Placed Successfully!')}
        className="w-full bg-[#800020] text-white py-3 rounded-xl font-semibold hover:bg-[#600018] transition-colors"
      >
        Confirm B2B Bulk Order
      </button>
    </div>
  );
}