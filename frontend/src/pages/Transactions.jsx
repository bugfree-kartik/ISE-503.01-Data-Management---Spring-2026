import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import api from '../lib/api';

const PAYMENT_METHODS = ['Meal Swipe', 'Dining Dollars', 'Wolfie Wallet', 'Credit Card', 'Cash'];

const defaultForm = {
  student_id: '', hall_id: '', employee_id: '', payment_method: 'Meal Swipe',
  transaction_time: new Date().toISOString().slice(0, 16),
};

const methodColor = {
  'Meal Swipe':    'bg-blue-100 text-blue-800',
  'Dining Dollars':'bg-green-100 text-green-800',
  'Wolfie Wallet': 'bg-purple-100 text-purple-800',
  'Credit Card':   'bg-orange-100 text-orange-800',
  'Cash':          'bg-gray-100 text-gray-700',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [students,     setStudents]     = useState([]);
  const [halls,        setHalls]        = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [menuItems,    setMenuItems]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [open,         setOpen]         = useState(false);
  const [form,         setForm]         = useState(defaultForm);
  const [cartItems,    setCartItems]    = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [filterMethod, setFilterMethod] = useState('All');

  const load = () =>
    api('/api/transactions').then(r => r.json())
      .then(setTransactions).finally(() => setLoading(false));

  useEffect(() => {
    load();
    api('/api/students').then(r => r.json()).then(setStudents);
    api('/api/dining-halls').then(r => r.json()).then(setHalls);
    api('/api/menu-items').then(r => r.json()).then(setMenuItems);
    api('/api/employees?role=Cashier').then(r => r.json()).then(setEmployees);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addToCart = () => {
    if (!selectedItem) return;
    const item = menuItems.find(i => i.item_id === parseInt(selectedItem));
    if (!item) return;
    if (cartItems.find(c => c.item_id === item.item_id)) {
      // increment qty
      setCartItems(prev => prev.map(c =>
        c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCartItems(prev => [...prev, { item_id: item.item_id, item_name: item.item_name, item_price: parseFloat(item.price), quantity: 1 }]);
    }
    setSelectedItem('');
  };

  const removeFromCart = (item_id) => setCartItems(prev => prev.filter(c => c.item_id !== item_id));
  const updateQty = (item_id, qty) => {
    if (qty < 1) return removeFromCart(item_id);
    setCartItems(prev => prev.map(c => c.item_id === item_id ? { ...c, quantity: qty } : c));
  };

  const total = cartItems.reduce((s, i) => s + i.item_price * i.quantity, 0);

  const handleSubmit = async () => {
    setError('');
    if (!form.student_id) return setError('Please select a student.');
    if (!form.hall_id)    return setError('Please select a dining hall.');
    if (!cartItems.length) return setError('Add at least one item to the cart.');
    setSaving(true);
    try {
      const res = await api('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parseInt(form.student_id),
          hall_id:    parseInt(form.hall_id),
          employee_id: form.employee_id ? parseInt(form.employee_id) : null,
          payment_method: form.payment_method,
          transaction_time: new Date(form.transaction_time).toISOString(),
          items: cartItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setOpen(false);
      setForm(defaultForm);
      setCartItems([]);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const displayed = filterMethod === 'All'
    ? transactions
    : transactions.filter(t => t.payment_method === filterMethod);

  const fmtTime = ts => ts
    ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

  if (loading) return <div className="text-center text-gray-500 mt-10">Loading transactions…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>💳 Transactions</h1>
          <p className="text-gray-500 mt-1">{displayed.length} of {transactions.length} transactions</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(defaultForm); setCartItems([]); setError(''); setOpen(true); }}>
          + New Transaction
        </button>
      </div>

      {/* Payment method filter */}
      <div className="card flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 font-medium">Filter:</span>
        {['All', ...PAYMENT_METHODS].map(m => (
          <button key={m} onClick={() => setFilterMethod(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterMethod === m ? 'bg-sbu-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {m}
          </button>
        ))}
      </div>

      {/* Summary stat */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PAYMENT_METHODS.map(m => {
          const mtxns = transactions.filter(t => t.payment_method === m);
          const total  = mtxns.reduce((s, t) => s + parseFloat(t.amount), 0);
          return (
            <div key={m} className="card text-center">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodColor[m]}`}>{m}</span>
              <p className="text-xl font-bold mt-2 text-gray-900">{mtxns.length}</p>
              <p className="text-xs text-gray-400">${total.toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Date & Time</th><th>Student</th><th>Hall</th>
                <th>Cashier</th><th>Items</th><th>Amount</th><th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(t => (
                <tr key={t.transaction_id}>
                  <td className="text-gray-400 text-xs">{t.transaction_id}</td>
                  <td className="text-xs text-gray-600 whitespace-nowrap">{fmtTime(t.transaction_time)}</td>
                  <td className="font-medium text-gray-900">{t.student_name}</td>
                  <td className="text-gray-600">{t.hall_name}</td>
                  <td className="text-gray-500 text-xs">{t.cashier_name || '—'}</td>
                  <td className="text-center text-gray-600">{t.item_count}</td>
                  <td className="font-bold text-sbu-red">${Number(t.amount).toFixed(2)}</td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodColor[t.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                      {t.payment_method}
                    </span>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-8">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transaction Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Transaction"
        onSubmit={handleSubmit}
        submitLabel={`Charge $${total.toFixed(2)}`}
        submitting={saving}
        wide
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Student */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select value={form.student_id} onChange={e => set('student_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                <option value="">Select student…</option>
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            {/* Dining Hall */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dining Hall *</label>
              <select value={form.hall_id} onChange={e => set('hall_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                <option value="">Select hall…</option>
                {halls.map(h => (
                  <option key={h.hall_id} value={h.hall_id}>{h.hall_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {/* Date/Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" value={form.transaction_time}
                onChange={e => set('transaction_time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Cashier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cashier (optional)</label>
              <select value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                <option value="">No cashier assigned</option>
                {employees.map(e => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.first_name} {e.last_name} — {e.hall_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Items *</label>
            <div className="flex gap-2">
              <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                <option value="">Choose a menu item…</option>
                {menuItems.map(i => (
                  <option key={i.item_id} value={i.item_id}>
                    {i.item_name} — ${Number(i.price).toFixed(2)}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addToCart}
                className="btn-primary px-5">
                + Add
              </button>
            </div>
          </div>

          {/* Cart */}
          {cartItems.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Order Items</span>
                <span className="text-xs font-semibold text-gray-600">{cartItems.length} item(s)</span>
              </div>
              <div className="divide-y divide-gray-200">
                {cartItems.map(item => (
                  <div key={item.item_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => removeFromCart(item.item_id)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors">✕</button>
                      <span className="text-sm font-medium text-gray-800">{item.item_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(item.item_id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">−</button>
                        <span className="px-2 text-sm font-medium text-gray-700 min-w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.item_id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                        ${(item.item_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex justify-between">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="text-base font-bold text-sbu-red">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
