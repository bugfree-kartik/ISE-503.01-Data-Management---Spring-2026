import { useEffect, useState } from 'react';
import api from '../lib/api';

function Stars({ rating }) {
  if (!rating) return <span className="text-gray-400 text-xs">No reviews</span>;
  return (
    <span className="flex items-center gap-1">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
        ))}
      </span>
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </span>
  );
}

export default function DiningHalls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/dining-halls')
      .then(r => r.json())
      .then(setHalls)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return <div className="text-gray-500 mt-10 text-center">Loading dining halls…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1>🏛️ Dining Halls</h1>
        <p className="text-gray-500 mt-1">All {halls.length} dining locations on campus</p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {halls.map((hall) => (
          <div key={hall.hall_id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-gray-900">{hall.hall_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">📍 {hall.location}</p>
              </div>
              <span className="text-xs bg-sbu-red/10 text-sbu-red font-semibold px-2 py-1 rounded-lg">
                Cap: {hall.capacity ?? '—'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hours</span>
                <span className="font-medium text-gray-700">
                  {fmt(hall.opening_time)} – {fmt(hall.closing_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stations</span>
                <span className="font-medium text-gray-700">{hall.station_count ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Rating</span>
                <Stars rating={hall.avg_rating} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reviews</span>
                <span className="font-medium text-gray-700">{hall.review_count ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table view */}
      <div className="card">
        <h2 className="mb-4">All Halls — Table View</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Opens</th>
                <th>Closes</th>
                <th>Stations</th>
                <th>Avg Rating</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {halls.map((h) => (
                <tr key={h.hall_id}>
                  <td className="text-gray-400">{h.hall_id}</td>
                  <td className="font-medium text-gray-900">{h.hall_name}</td>
                  <td>{h.location}</td>
                  <td>{h.capacity ?? '—'}</td>
                  <td>{fmt(h.opening_time)}</td>
                  <td>{fmt(h.closing_time)}</td>
                  <td>{h.station_count ?? 0}</td>
                  <td>
                    {h.avg_rating
                      ? <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          {h.avg_rating}
                        </span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td>{h.review_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
