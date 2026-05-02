import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard    from './pages/Dashboard';
import DiningHalls  from './pages/DiningHalls';
import MenuItems    from './pages/MenuItems';
import DailyMenu    from './pages/DailyMenu';
import Students     from './pages/Students';
import Reviews      from './pages/Reviews';
import Analytics    from './pages/Analytics';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/dining-halls"  element={<DiningHalls />} />
        <Route path="/menu-items"    element={<MenuItems />} />
        <Route path="/daily-menu"    element={<DailyMenu />} />
        <Route path="/students"      element={<Students />} />
        <Route path="/reviews"       element={<Reviews />} />
        <Route path="/transactions"  element={<Transactions />} />
        <Route path="/analytics"     element={<Analytics />} />
      </Routes>
    </Layout>
  );
}
