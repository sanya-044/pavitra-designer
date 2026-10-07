import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function AdminCatalog({ sarees = [], setSarees }) {
  const [newSaree, setNewSaree] = useState({
    name: '',
    category: 'Banarasi',
    moq: '5 pcs',
    price: '',
    origin: 'Varanasi',
    rating: 4.8,
    image: ''
  });

  const handleAddSaree = (e) => {
    e.preventDefault();
    if (!newSaree.name || !newSaree.price || !newSaree.image) {
      alert('Please fill out all required fields including the image URL.');
      return;
    }

    const createdSaree = {
      id: Date.now(),
      ...newSaree,
      price: `₹${newSaree.price}/pc`
    };

    setSarees([createdSaree, ...sarees]);
    setNewSaree({ name: '', category: 'Banarasi', moq: '5 pcs', price: '', origin: 'Varanasi', rating: 4.8, image: '' });
    alert('New saree successfully added to the user catalog!');
  };

  const handleDeleteSaree = (id) => {
    setSarees(sarees.filter((s) => s.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Saree Form */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <PlusCircle className="text-amber-950" size={20} />
          <h2 className="font-bold text-lg text-stone-900">Add New Saree</h2>
        </div>

        <form onSubmit={handleAddSaree} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Saree Name</label>
            <input 
              type="text" 
              placeholder="e.g. Royal Banarasi Silk"
              value={newSaree.name}
              onChange={(e) => setNewSaree({...newSaree, name: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Category</label>
              <select 
                value={newSaree.category}
                onChange={(e) => setNewSaree({...newSaree, category: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              >
                <option value="Banarasi">Banarasi</option>
                <option value="Kanchipuram">Kanchipuram</option>
                <option value="Chanderi">Chanderi</option>
                <option value="Organza">Organza</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Origin City</label>
              <input 
                type="text" 
                placeholder="e.g. Varanasi"
                value={newSaree.origin}
                onChange={(e) => setNewSaree({...newSaree, origin: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Price per pc (₹)</label>
              <input 
                type="text" 
                placeholder="4500"
                value={newSaree.price}
                onChange={(e) => setNewSaree({...newSaree, price: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">MOQ</label>
              <input 
                type="text" 
                placeholder="5 pcs"
                value={newSaree.moq}
                onChange={(e) => setNewSaree({...newSaree, moq: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Image URL</label>
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/..."
              value={newSaree.image}
              onChange={(e) => setNewSaree({...newSaree, image: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-amber-950 text-white py-3 rounded-xl font-semibold hover:bg-amber-900 transition shadow"
          >
            Publish to Catalog
          </button>
        </form>
      </div>

      {/* Saree Inventory List for Deletion */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h2 className="font-bold text-lg text-stone-900 border-b pb-3">Active Catalog Inventory ({sarees.length})</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {sarees.map((saree) => (
            <div key={saree.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <img src={saree.image} alt={saree.name} className="w-14 h-14 object-cover rounded-lg" />
                <div>
                  <span className="text-xs font-semibold text-amber-900">{saree.origin} • MOQ: {saree.moq}</span>
                  <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{saree.name}</h4>
                  <p className="text-xs font-extrabold text-stone-800">{saree.price}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteSaree(saree.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Remove from Catalog"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}