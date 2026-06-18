import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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

// අලුතින් සෑදූ SplashScreen එක Import කිරීම
import SplashScreen from './components/SplashScreen';

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

// ==========================================
// Admin Route Guard
// ==========================================
function AdminRoute({ children }) {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/" replace />;
  }
  
  const user = JSON.parse(userStr);
  
  if (user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
}

// ==========================================
// Driver Route Guard 
// ==========================================
function DriverRoute({ children }) {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/" replace />;
  }
  
  const user = JSON.parse(userStr);
  
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
}

function App() {
  // Splash Screen එක පෙන්වීමට අවශ්‍ය State එක
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      let metaTheme = document.querySelector("meta[name='theme-color']");
      
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      
      metaTheme.setAttribute('content', isDark ? '#111827' : '#f4f7fb');
    };

    updateThemeColor();

    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => observer.disconnect();
  }, []);

  useAutoSync();

  return (
    <>
      {/* Splash Screen එක Render කිරීම */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <Router>
        <GlobalAuthCheck />
        
        <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#111827] text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Login />} />
            
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            <Route path="/home" element={<DriverRoute><Home /></DriverRoute>} />
            <Route path="/settings" element={<DriverRoute><BusinessProfile /></DriverRoute>} />
            <Route path="/add-route" element={<DriverRoute><AddRoute /></DriverRoute>} />
            <Route path="/add-shop" element={<DriverRoute><AddShop /></DriverRoute>} />
            <Route path="/add-item" element={<DriverRoute><AddItem /></DriverRoute>} />
            <Route path="/add-bill" element={<DriverRoute><AddBill /></DriverRoute>} />
            <Route path="/profile" element={<DriverRoute><Profile /></DriverRoute>} />
            <Route path="/routes" element={<DriverRoute><RoutesTab /></DriverRoute>} />
            <Route path="/shops" element={<DriverRoute><Shops /></DriverRoute>} />
            <Route path="/shop-history/:shopId" element={<DriverRoute><ShopHistory /></DriverRoute>} />
            <Route path="/edit-bill/:billId" element={<DriverRoute><EditBill /></DriverRoute>} />
            <Route path="/reports" element={<DriverRoute><Reports /></DriverRoute>} />
            <Route path="/more" element={<DriverRoute><MoreTab /></DriverRoute>} />
            <Route path="/expenses" element={<DriverRoute><Expenses /></DriverRoute>} />
            <Route path='/backup' element={<DriverRoute><BackupSync/></DriverRoute>} />
            
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;