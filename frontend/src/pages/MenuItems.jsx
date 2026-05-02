import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import api from '../lib/api';

const CATEGORIES = ['All', 'Entree', 'Side', 'Soup', 'Salad', 'Appetizer', 'Dessert', 'Beverage'];
const CAT_OPTIONS = ['Entree', 'Side', 'Soup', 'Salad', 'Appetizer', 'Dessert', 'Beverage'];

const ALL_ALLERGENS = [
  { id: 1, name: 'Peanuts' }, { id: 2, name: 'Tree Nuts' },
  { id: 3, name: 'Dairy' },   { id: 4, name: 'Eggs' },
  { id: 5, name: 'Soy' },     { id: 6, name: 'Wheat/Gluten' },
  { id: 7, name: 'Fish' },    { id: 8, name: 'Shellfish' },
  { id: 9, name: 'Sesame' },  { id: 10, name: 'Sulfites' },
];

const defaultForm = {
  item_name: '', category: 'Entree', calories: '', price: '',
  is_vegetarian: false, is_vegan: false, is_gluten_free: false,
  allergen_ids: [],
};

function DietaryBadge({ item }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {item.is_vegan      && <span className="badge-vegan">Vegan</span>}
      {item.is_vegetarian && !item.is_vegan && <span className="badge-vegetarian">Vegetarian</span>}
      {item.is_gluten_free && <span className="badge-gf">GF</span>}
    </div>
  );
}

export default function MenuItems() {
  const [items,    setItems]    = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState('All');
  const [vegan,    setVegan]    = useState(false);
  const [veggie,   setVeggie]   = useState(false);
  const [gf,       setGf]       = useState(false);
  const [search,   setSearch]   = useState('');
  const [open,     setOpen]     = useState(false);
  const [form,     setForm]     = useState(defaultForm);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = () =>
    api('/api/menu-items').then(r => r.json())
      .then(d => { setItems(d); setFiltered(d); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let data = items;
    if (category !== 'All') data = data.filter(i => i.category === category);
    if (vegan)  data = data.filter(i => i.is_vegan);
    if (veggie) data = data.filter(i => i.is_vegetarian);
    if (gf)     data = data.filter(i => i.is_gluten_free);
    if (search) data = data.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(data);
  }, [category, vegan, veggie, gf, search, items]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAllergen = (id) => {
    setForm(f => ({
      ...f,
      allergen_ids: f.allergen_ids.includes(id)
        ? f.allergen_ids.filter(a => a !== id)
        : [...f.allergen_ids, id],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.item_name.trim()) return setError('Item name is required.');
    if (!form.price || isNaN(form.price) || parseFloat(form.price) < 0) return setError('Valid price is required.');
    setSaving(true);
    try {
      const res = await api('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: form.item_name.trim(),
          category: form.category,
          calories: form.calories ? parseInt(form.calories) : null,
          price: parseFloat(form.price),
          is_vegetarian: form.is_vegetarian,
          is_vegan: form.is_vegan,
          is_gluten_free: form.is_gluten_free,
          allergen_ids: form.allergen_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setOpen(false);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 mt-10 text-center">Loading menu…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>🍽️ Menu Items</h1>
          <p className="text-gray-500 mt-1">{filtered.length} of {items.length} items shown</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(defaultForm); setError(''); setOpen(true); }}>
          + Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === cat ? 'bg-sbu-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30 w-48" />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={vegan}  onChange={e => setVegan(e.target.checked)} className="accent-green-600" /> Vegan
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={veggie} onChange={e => setVeggie(e.target.checked)} className="accent-lime-600" /> Vegetarian
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={gf}     onChange={e => setGf(e.target.checked)} className="accent-amber-600" /> Gluten-Free
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th><th>Category</th><th>Cal</th><th>Price</th><th>Dietary</th><th>Allergens</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.item_id}>
                  <td className="font-medium text-gray-900">{item.item_name}</td>
                  <td>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                  </td>
                  <td className="text-gray-500">{item.calories ?? '—'}</td>
                  <td className="font-semibold text-gray-800">${Number(item.price).toFixed(2)}</td>
                  <td><DietaryBadge item={item} /></td>
                  <td className="text-xs text-gray-500 max-w-48 truncate" title={item.allergens}>
                    {item.allergens === 'None'
                      ? <span className="text-green-600 font-medium">None</span>
                      : item.allergens}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No items match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Menu Item Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Menu Item"
        onSubmit={handleSubmit}
        submitLabel="Add Item"
        submitting={saving}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input type="text" value={form.item_name} onChange={e => set('item_name', e.target.value)}
              placeholder="e.g. Grilled Salmon"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                {CAT_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input type="number" min="0" step="0.25" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="9.50"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calories (optional)</label>
            <input type="number" min="0" value={form.calories} onChange={e => set('calories', e.target.value)}
              placeholder="450"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
          </div>

          {/* Dietary flags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Labels</label>
            <div className="flex flex-wrap gap-3">
              {[
                ['is_vegetarian', 'Vegetarian', 'accent-lime-600'],
                ['is_vegan',      'Vegan',      'accent-green-600'],
                ['is_gluten_free','Gluten-Free','accent-amber-600'],
              ].map(([key, label, accent]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
                    className={accent} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ALLERGENS.map(a => (
                <label key={a.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox"
                    checked={form.allergen_ids.includes(a.id)}
                    onChange={() => toggleAllergen(a.id)}
                    className="accent-red-500" />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
