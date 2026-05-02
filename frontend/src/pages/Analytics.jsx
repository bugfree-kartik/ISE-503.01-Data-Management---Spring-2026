import { useEffect, useState } from 'react';
import api from '../lib/api';

const QUERY_META = [
  { id: 1,  title: 'Top 5 Students by Spend',          joins: 'Student × DiningTransaction × MealPlan',                  desc: 'Aggregation + ORDER BY + LIMIT' },
  { id: 2,  title: 'Top 10 Most Popular Menu Items',    joins: 'MenuItem × TransactionItem × DiningTransaction',          desc: 'Multi-aggregation + ranking' },
  { id: 3,  title: 'Hall Ratings (≥ 3 Reviews)',        joins: 'DiningHall × Review',                                     desc: 'GROUP BY + HAVING filter' },
  { id: 4,  title: 'Vegan + GF Allergen-Free Items',    joins: 'MenuItem × ItemAllergen (LEFT)',                          desc: 'LEFT JOIN + IS NULL anti-join' },
  { id: 5,  title: 'Supervisor Analysis',               joins: 'Employee SELF-JOIN × DiningHall',                         desc: 'Self-join + wage gap calculation' },
  { id: 6,  title: 'Revenue by Hall × Payment Method',  joins: 'DiningHall × DiningTransaction',                         desc: 'Two-key GROUP BY aggregation' },
  { id: 7,  title: 'Students Who Visited 3+ Halls',     joins: 'Student × DiningTransaction × MealPlan',                  desc: 'COUNT(DISTINCT) + HAVING' },
  { id: 8,  title: 'Daily Menu with Allergen Warnings', joins: 'DailyMenu × Station × DiningHall × MenuItem × Allergen', desc: '6-way JOIN + STRING_AGG' },
  { id: 9,  title: 'Dead Menu Items (Never Ordered)',   joins: 'MenuItem × TransactionItem (LEFT) × Review (LEFT)',       desc: 'Double LEFT JOIN anti-join' },
  { id: 10, title: 'High-Investment Students',          joins: 'Student × MealPlan × DiningTransaction + subqueries',    desc: 'Scalar subqueries + nested aggregation' },
];

function ResultTable({ columns, rows }) {
  if (!columns?.length) return null;
  return (
    <div className="table-container mt-3">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c}>{c.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c}>
                  {row[c] === null || row[c] === undefined
                    ? <span className="text-gray-400">—</span>
                    : String(row[c])
                  }
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center text-gray-400 py-6">No results.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function QueryCard({ meta }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await api(`/api/analytics/${meta.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-8 h-8 rounded-lg bg-sbu-red text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {meta.id}
          </span>
          <div className="flex-1">
            <h3 className="text-gray-900">{meta.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.joins}</p>
            <p className="text-xs text-blue-600 mt-0.5 font-medium">{meta.desc}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={run} className="btn-primary" disabled={loading}>
            {loading ? 'Running…' : '▶ Run'}
          </button>
          {result && (
            <button onClick={() => setOpen(o => !o)} className="btn-secondary">
              {open ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {result && open && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">
            {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned
          </p>
          <ResultTable columns={result.columns} rows={result.rows} />
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [runAll, setRunAll] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1>📊 Analytics — 10 Complex Queries</h1>
          <p className="text-gray-500 mt-1">
            Each query demonstrates advanced SQL: multi-table JOINs, aggregation, subqueries, self-joins, and HAVING filters.
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Queries',     value: '10' },
          { label: 'Techniques',  value: 'JOIN, HAVING, Subquery, Self-join, Anti-join' },
          { label: 'Tables Used', value: '12' },
          { label: 'Database',    value: 'PostgreSQL' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-bold text-gray-800 text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Query cards */}
      <div className="space-y-4">
        {QUERY_META.map(meta => (
          <QueryCard key={meta.id} meta={meta} />
        ))}
      </div>
    </div>
  );
}
