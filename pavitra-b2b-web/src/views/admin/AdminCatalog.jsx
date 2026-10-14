import React, { useState } from 'react';
import { productApi } from '../../services/api';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

export default function AdminCatalog({ sarees = [], setSarees, onRefresh }) {
  const [newSaree, setNewSaree] = useState({
    name: '',
    category: 'Banarasi',
    fabric: 'Katan Silk',
    moq: '5',
    price: '',
    origin: 'Varanasi',
    stock: '50',
    rating: 4.8,
    image: ''
  });

  const [loading, setLoading] = useState(false);

  const handleAddSaree = async (e) => {
    e.preventDefault();
    if (!newSaree.name || !newSaree.price || !newSaree.image) {
      alert('Please fill out all required fields including the image URL.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: newSaree.name.trim(),
        category: newSaree.category,
        fabric: newSaree.fabric || 'Silk',
        origin: newSaree.origin.trim(),
        price: Number(newSaree.price),
        moq: Number(newSaree.moq) || 5,
        stock: Number(newSaree.stock) || 50,
        rating: Number(newSaree.rating) || 4.8,
        image: newSaree.image.trim()
      };

      const res = await productApi.createProduct(payload);
      if (res.data?.product && setSarees) {
        setSarees([res.data.product, ...sarees]);
      }
      setNewSaree({
        name: '',
        category: 'Banarasi',
        fabric: 'Katan Silk',
        moq: '5',
        price: '',
        origin: 'Varanasi',
        stock: '50',
        rating: 4.8,
        image: ''
      });
      alert('New saree successfully added to the live catalog!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error publishing saree: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSaree = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this saree from the public catalog?')) {
      return;
    }

    try {
      await productApi.deleteProduct(id);
      if (setSarees) {
        setSarees(sarees.filter((s) => (s.id || s._id) !== id));
      }
      alert('Product successfully deactivated.');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete product: ${err.message}`);
    }
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
              onChange={(e) => setNewSaree({ ...newSaree, name: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Category</label>
              <select 
                value={newSaree.category}
                onChange={(e) => setNewSaree({ ...newSaree, category: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              >
                <option value="Banarasi">Banarasi</option>
                <option value="Kanchipuram">Kanchipuram</option>
                <option value="Chanderi">Chanderi</option>
                <option value="Organza">Organza</option>
                <option value="Silk">Silk</option>
                <option value="Cotton">Cotton</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Origin City</label>
              <input 
                type="text" 
                placeholder="e.g. Varanasi"
                value={newSaree.origin}
                onChange={(e) => setNewSaree({ ...newSaree, origin: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Price per pc (₹)</label>
              <input 
                type="number" 
                placeholder="4500"
                value={newSaree.price}
                onChange={(e) => setNewSaree({ ...newSaree, price: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
                min={1}
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">MOQ (pieces)</label>
              <input 
                type="number" 
                placeholder="5"
                value={newSaree.moq}
                onChange={(e) => setNewSaree({ ...newSaree, moq: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
                required
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Image URL</label>
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/..."
              value={newSaree.image}
              onChange={(e) => setNewSaree({ ...newSaree, image: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-950"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-950 text-white py-3 rounded-xl font-semibold hover:bg-amber-900 transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Publish to Live Catalog</span>
          </button>
        </form>
      </div>

      {/* Saree Inventory List for Deletion */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h2 className="font-bold text-lg text-stone-900 border-b pb-3">Active Catalog Inventory ({sarees.length})</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {sarees.map((saree) => {
            const id = saree.id || saree._id;
            const price = saree.formattedPrice || (typeof saree.price === 'number' ? `₹${saree.price.toLocaleString('en-IN')}/pc` : saree.price);
            const moq = saree.formattedMoq || (saree.moq ? `${saree.moq} pcs` : '5 pcs');

            return (
              <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <img src={saree.image} alt={saree.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div>
                    <span className="text-xs font-semibold text-amber-900">{saree.origin} • MOQ: {moq}</span>
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{saree.name}</h4>
                    <p className="text-xs font-extrabold text-stone-800">{price}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteSaree(id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove from Catalog"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}