import { useEffect, useState } from 'react';
import api from '../lib/api';

function StatCard({ label, value, sub, color = 'bg-white' }) {
  return (
    <div className={`card flex flex-col gap-1 ${color}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  );
}

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [topSpend, setTopSpend] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [hallRatings, setHallRatings] = useState([]);

  useEffect(() => {
    api('/api/stats').then(r => r.json()).then(setStats);
    api('/api/analytics/1').then(r => r.json()).then(d => setTopSpend(d.rows || []));
    api('/api/analytics/2').then(r => r.json()).then(d => setTopItems((d.rows || []).slice(0, 5)));
    api('/api/analytics/3').then(r => r.json()).then(d => setHallRatings(d.rows || []));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SBU Dining Dashboard</h1>
        <p className="text-gray-500 mt-1">Stony Brook University · Spring 2026 Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Students"     value={stats?.students}     sub="enrolled" />
        <StatCard label="Dining Halls" value={stats?.halls}        sub="on campus" />
        <StatCard label="Menu Items"   value={stats?.menu_items}   sub="available" />
        <StatCard label="Employees"    value={stats?.employees}    sub="staff" />
        <StatCard label="Transactions" value={stats?.transactions} sub="recorded" />
        <StatCard label="Reviews"      value={stats?.reviews}      sub="submitted" />
        <StatCard label="Total Revenue" value={stats ? `$${stats.total_revenue}` : null} sub="all time" />
        <StatCard label="Avg Rating"   value={stats?.avg_rating ? `${stats.avg_rating} / 5` : null} sub="across all halls" />
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Spenders */}
        <div className="card">
          <h2 className="mb-4">🏆 Top 5 Students by Spend</h2>
          <div className="space-y-3">
            {topSpend.map((row, i) => (
              <div key={row.student_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                    i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{row.student_name}</p>
                    <p className="text-xs text-gray-400">{row.meal_plan} · {row.num_transactions} txn</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-sbu-red">${row.total_spent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Menu Items */}
        <div className="card">
          <h2 className="mb-4">🍴 Top 5 Menu Items</h2>
          <div className="space-y-3">
            {topItems.map((row, i) => (
              <div key={row.item_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-sbu-red text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{row.item_name}</p>
                    <p className="text-xs text-gray-400">{row.category} · {row.appears_in_transactions} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{row.total_sold} sold</p>
                  <p className="text-xs text-gray-400">${row.total_revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hall Ratings */}
      <div className="card">
        <h2 className="mb-4">🏛️ Dining Hall Ratings</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hall</th>
                <th>Location</th>
                <th>Reviews</th>
                <th>Avg Rating</th>
                <th>Low / High</th>
              </tr>
            </thead>
            <tbody>
              {hallRatings.map((row) => (
                <tr key={row.hall_id}>
                  <td className="font-medium text-gray-900">{row.hall_name}</td>
                  <td>{row.location}</td>
                  <td>{row.num_reviews}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Stars rating={row.avg_rating} />
                      <span className="text-xs font-semibold text-gray-700">{row.avg_rating}</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-500">{row.lowest_rating} / {row.highest_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
