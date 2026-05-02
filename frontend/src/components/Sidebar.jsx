import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/',              label: 'Dashboard',    icon: '🏠' },
  { to: '/dining-halls',  label: 'Dining Halls', icon: '🏛️' },
  { to: '/menu-items',    label: 'Menu Items',   icon: '🍽️' },
  { to: '/daily-menu',    label: 'Daily Menu',   icon: '📅' },
  { to: '/students',      label: 'Students',     icon: '👤' },
  { to: '/transactions',  label: 'Transactions', icon: '💳' },
  { to: '/reviews',       label: 'Reviews',      icon: '⭐' },
  { to: '/analytics',     label: 'Analytics',    icon: '📊' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-sbu-gray min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sbu-red flex items-center justify-center text-white font-bold text-sm">
            SBU
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">SBU Dining</p>
            <p className="text-gray-400 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 sidebar-scroll overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-sbu-red text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">ISE 503 · Spring 2026</p>
        <p className="text-gray-600 text-xs">Stony Brook University</p>
      </div>
    </aside>
  );
}
