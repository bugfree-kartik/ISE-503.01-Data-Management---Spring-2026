import { useEffect, useState } from 'react';
import api from '../lib/api';

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= rating ? 'star-filled text-base' : 'star-empty text-base'}>★</span>
      ))}
    </span>
  );
}

const ratingColors = {
  5: 'border-l-green-500',
  4: 'border-l-lime-400',
  3: 'border-l-amber-400',
  2: 'border-l-orange-400',
  1: 'border-l-red-500',
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    api('/api/reviews')
      .then(r => r.json())
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  const displayed = reviews.filter(r => {
    if (filter === 'halls') return r.hall_name;
    if (filter === 'items') return r.item_name;
    return true;
  });

  const fmtDate = d => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (loading) return <div className="text-center text-gray-500 mt-10">Loading reviews…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1>⭐ Reviews</h1>
        <p className="text-gray-500 mt-1">{displayed.length} reviews</p>
      </div>

      {/* Filter pills */}
      <div className="card flex gap-3 items-center">
        <span className="text-sm text-gray-500 font-medium">Show:</span>
        {[['all', 'All Reviews'], ['halls', 'Hall Reviews'], ['items', 'Item Reviews']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === val ? 'bg-sbu-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Rating distribution */}
      <div className="card">
        <h3 className="mb-3 text-gray-700">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(r => {
            const count = reviews.filter(rev => rev.rating === r).length;
            const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={r} className="flex items-center gap-3">
                <span className="text-amber-400 font-bold w-4">{r}</span>
                <span className="text-amber-400 text-sm">★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {displayed.map(r => (
          <div key={r.review_id} className={`card border-l-4 ${ratingColors[r.rating] || 'border-l-gray-300'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Stars rating={r.rating} />
                  {r.hall_name && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      🏛️ {r.hall_name}
                    </span>
                  )}
                  {r.item_name && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      🍴 {r.item_name}
                    </span>
                  )}
                </div>
                {r.review_text && <p className="text-sm text-gray-700 mt-1">"{r.review_text}"</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-gray-600">{r.student_name}</p>
                <p className="text-xs text-gray-400">{r.class_year}</p>
                <p className="text-xs text-gray-400 mt-1">{fmtDate(r.review_date)}</p>
              </div>
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="text-center text-gray-400 py-10">No reviews found.</div>
        )}
      </div>
    </div>
  );
}
