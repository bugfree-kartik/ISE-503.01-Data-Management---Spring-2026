import { useEffect, useState } from 'react';
import api from '../lib/api';

const PERIODS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Late Night'];

function DietTag({ item }) {
  return (
    <span className="inline-flex gap-1">
      {item.is_vegan       && <span className="badge-vegan">V</span>}
      {item.is_vegetarian && !item.is_vegan && <span className="badge-vegetarian">VG</span>}
      {item.is_gluten_free && <span className="badge-gf">GF</span>}
    </span>
  );
}

export default function DailyMenu() {
  const [menuData, setMenuData] = useState([]);
  const [dates,    setDates]    = useState([]);
  const [date,     setDate]     = useState('2026-04-20');
  const [period,   setPeriod]   = useState('All');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    api('/api/daily-menu/dates').then(r => r.json()).then(d => {
      const fmt = d.map(dt => (typeof dt === 'string' ? dt.slice(0,10) : new Date(dt).toISOString().slice(0,10)));
      setDates(fmt);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (period !== 'All') params.set('period', period);
    api(`/api/daily-menu?${params}`)
      .then(r => r.json())
      .then(setMenuData)
      .finally(() => setLoading(false));
  }, [date, period]);

  // Group by hall → meal_period → station
  const grouped = {};
  menuData.forEach(row => {
    const hall = row.hall_name;
    const p    = row.meal_period;
    const st   = row.station_name;
    if (!grouped[hall])      grouped[hall] = {};
    if (!grouped[hall][p])   grouped[hall][p] = {};
    if (!grouped[hall][p][st]) grouped[hall][p][st] = [];
    grouped[hall][p][st].push(row);
  });

  const periodColor = {
    Breakfast:   'bg-amber-50  border-amber-200  text-amber-800',
    Lunch:       'bg-blue-50   border-blue-200   text-blue-800',
    Dinner:      'bg-purple-50 border-purple-200 text-purple-800',
    'Late Night':'bg-gray-800  border-gray-700   text-gray-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>📅 Daily Menu</h1>
        <p className="text-gray-500 mt-1">Browse what's being served today at each hall</p>
      </div>

      {/* Controls */}
      <div className="card flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <select
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbu-red/30"
          >
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-sbu-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">{menuData.length} items</span>
      </div>

      {loading && <div className="text-center text-gray-400 py-10">Loading menu…</div>}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="text-center text-gray-400 py-10">No menu data for selected filters.</div>
      )}

      {/* Hall sections */}
      {!loading && Object.entries(grouped).map(([hallName, periods]) => (
        <div key={hallName} className="card space-y-4">
          <h2 className="flex items-center gap-2">
            <span className="text-sbu-red">🏛️</span> {hallName}
          </h2>
          {Object.entries(periods).map(([mealPeriod, stations]) => (
            <div key={mealPeriod}>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-3 ${periodColor[mealPeriod] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {mealPeriod}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Object.entries(stations).map(([stationName, items]) => (
                  <div key={stationName} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">{stationName}</p>
                    <div className="space-y-1.5">
                      {items.map(item => (
                        <div key={item.item_id} className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-800">{item.item_name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <DietTag item={item} />
                              {item.allergens !== 'None' && (
                                <span className="text-xs text-red-500" title={item.allergens}>⚠️</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
