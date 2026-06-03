import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import BusinessProfile from './pages/BusinessProfile';
import AddRoute from './pages/AddRoute';
import AddShop from './pages/AddShop';
import AddItem from './pages/AddItem';
import AddBill from './pages/AddBill';
import Profile from './pages/Profile';
import RoutesTab from './pages/Routes';
import Shops from './pages/Shops';
import ShopHistory from './pages/ShopHistory';
import EditBill from './pages/EditBill';
import Reports from './pages/Reports';
import MoreTab from './pages/More';
import Expenses from './pages/Expenses';
import './App.css';
import BackupSync from './pages/BackupSync';
import useAutoSync from './hooks/useAutoSync';

// ==========================================
// Global Auth Checker
// ==========================================
function GlobalAuthCheck() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkExpiry = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.valid_until) {
          const expiryDate = new Date(user.valid_until).getTime();
          const currentTime = new Date().getTime();

          if (currentTime >= expiryDate) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (location.pathname !== '/') {
              navigate('/', { 
                state: { errorMsg: 'ඔබගේ ගිණුමේ වලංගු කාලය අවසන් වී ඇත. කරුණාකර නැවත ඇතුල් වන්න.' } 
              });
            }
          }
        }
      }
    };

    const interval = setInterval(checkExpiry, 10000);
    checkExpiry();

    return () => clearInterval(interval);
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useAutoSync();

  return (
    <Router>
      <GlobalAuthCheck />
      
      {/* මෙහි තිබූ bg-gray-100 ඉවත් කර Light/Dark mode පසුබිම් වර්ණ එක් කර ඇත */}
      <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#111827] text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/settings" element={<BusinessProfile />} />
          <Route path="/add-route" element={<AddRoute />} />
          <Route path="/add-shop" element={<AddShop />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/add-bill" element={<AddBill />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/routes" element={<RoutesTab />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/shop-history/:shopId" element={<ShopHistory />} />
          <Route path="/edit-bill/:billId" element={<EditBill />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/more" element={<MoreTab />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path='/backup' element={<BackupSync/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;