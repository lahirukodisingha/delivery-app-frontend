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
// අලුතින් හදපු Hook එක Import කරගන්න
import useAutoSync from './hooks/useAutoSync';

// ==========================================
// අලුතින් එක් කරන ලද Global Auth Checker එක
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
          // වලංගු කාලය සහ දැනට වෙලාව ගන්නවා
          const expiryDate = new Date(user.valid_until).getTime();
          const currentTime = new Date().getTime();

          // දැනට වෙලාව, වලංගු කාලය ඉක්මවා ගොස් ඇත්නම්
          if (currentTime >= expiryDate) {
            // Local storage එකෙන් දත්ත මකා දමනවා
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // යූසර් දැනටමත් Login පේජ් එකේ නැත්නම් ඔහුව ලොග් අවුට් කරලා එතනට යවනවා
            if (location.pathname !== '/') {
              navigate('/', { 
                state: { errorMsg: 'ඔබගේ ගිණුමේ වලංගු කාලය අවසන් වී ඇත. කරුණාකර නැවත ඇතුල් වන්න.' } 
              });
            }
          }
        }
      }
    };

    // සෑම තත්පර 10කට වරක්ම Background එකේ කාලය පරීක්ෂා කරයි
    const interval = setInterval(checkExpiry, 10000);
    checkExpiry(); // Component එක ලෝඩ් වෙද්දිම එක් වරක් පරීක්ෂා කරයි

    return () => clearInterval(interval);
  }, [navigate, location.pathname]);

  return null; // මෙය UI එකේ පෙන්වීමට දෙයක් නොමැති Component එකකි
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
      {/* මේක අනිවාර්යයෙන්ම <Router> එක ඇතුලෙම දාන්න ඕනෙ, මොකද useNavigate පාවිච්චි වෙන නිසා */}
      <GlobalAuthCheck />
      
      <div className="min-h-screen bg-gray-100">
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