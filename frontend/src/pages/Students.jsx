import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import api from '../lib/api';

const YEARS = ['All', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

const defaultForm = {
  sbu_id: '', first_name: '', last_name: '', email: '',
  class_year: 'Freshman', major: '', plan_id: '', wolfie_wallet_balance: '0',
};

const yearColor = {
  Freshman: 'bg-green-100 text-green-800', Sophomore: 'bg-blue-100 text-blue-800',
  Junior: 'bg-purple-100 text-purple-800', Senior: 'bg-orange-100 text-orange-800',
  Graduate: 'bg-gray-200 text-gray-800',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [plans,    setPlans]    = useState([]);
  const [year,     setYear]     = useState('All');
  const [search,   setSearch]   = useState('');
  const [open,     setOpen]     = useState(false);
  const [form,     setForm]     = useState(defaultForm);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = () =>
    api('/api/students').then(r => r.json())
      .then(d => { setStudents(d); setFiltered(d); })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    fetchPlans();
  }, []);

  const fetchPlans = () => {
    api('/api/meal-plans').then(r => r.json()).then(setPlans);
  };

  useEffect(() => {
    let data = students;
    if (year !== 'All') data = data.filter(s => s.class_year === year);
    if (search) data = data.filter(s =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.major?.toLowerCase().includes(search.toLowerCase()) ||
      s.sbu_id.includes(search)
    );
    setFiltered(data);
  }, [year, search, students]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.sbu_id || !form.first_name || !form.last_name || !form.email || !form.class_year) {
      return setError('SBU ID, name, email, and class year are required.');
    }
    if (!/^\d{9}$/.test(form.sbu_id)) return setError('SBU ID must be exactly 9 digits.');
    if (!form.email.includes('@')) return setError('Enter a valid email address.');
    setSaving(true);
    try {
      const res = await api('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sbu_id: form.sbu_id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          class_year: form.class_year,
          major: form.major || null,
          plan_id: form.plan_id ? parseInt(form.plan_id) : null,
          wolfie_wallet_balance: parseFloat(form.wolfie_wallet_balance || 0),
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

  if (loading) return <div className="text-center text-gray-500 mt-10">Loading students…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>👤 Students</h1>
          <p className="text-gray-500 mt-1">{filtered.length} of {students.length} students</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(defaultForm); setError(''); setOpen(true); }}>
          + Register Student
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search name, major, or SBU ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30 w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                year === y ? 'bg-sbu-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SBU ID</th><th>Name</th><th>Year</th><th>Major</th>
                <th>Meal Plan</th><th>Plan Price</th><th>Dining $</th>
                <th>Wallet</th><th>Transactions</th><th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.student_id}>
                  <td className="font-mono text-xs text-gray-500">{s.sbu_id}</td>
                  <td className="font-medium text-gray-900">{s.full_name}</td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${yearColor[s.class_year] || 'bg-gray-100 text-gray-600'}`}>
                      {s.class_year}
                    </span>
                  </td>
                  <td className="text-gray-600 max-w-36 truncate" title={s.major}>{s.major ?? '—'}</td>
                  <td>{s.plan_name ? <span className="text-xs font-semibold text-sbu-red">{s.plan_name}</span> : <span className="text-gray-400">—</span>}</td>
                  <td>{s.plan_price ? `$${Number(s.plan_price).toFixed(2)}` : '—'}</td>
                  <td>{s.dining_dollars ? `$${Number(s.dining_dollars).toFixed(2)}` : '—'}</td>
                  <td className="font-medium">${Number(s.wolfie_wallet_balance).toFixed(2)}</td>
                  <td className="text-center">{s.transaction_count}</td>
                  <td className="font-semibold text-sbu-red">${s.total_spent}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-400 py-8">No students match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Student Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register New Student"
        onSubmit={handleSubmit}
        submitLabel="Register"
        submitting={saving}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)}
                placeholder="Aiden"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)}
                placeholder="Park"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SBU ID * (9 digits)</label>
            <input type="text" value={form.sbu_id} onChange={e => set('sbu_id', e.target.value)}
              placeholder="109876599" maxLength={9}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="student@stonybrook.edu"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Year *</label>
              <select value={form.class_year} onChange={e => set('class_year', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <input type="text" value={form.major} onChange={e => set('major', e.target.value)}
                placeholder="Computer Science"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Plan</label>
              <select value={form.plan_id} onChange={e => set('plan_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30">
                <option value="">No meal plan</option>
                {plans.map(p => (
                  <option key={p.plan_id} value={p.plan_id}>{p.plan_name} (${p.price})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wolfie Wallet ($)</label>
              <input type="number" min="0" step="0.01" value={form.wolfie_wallet_balance}
                onChange={e => set('wolfie_wallet_balance', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
