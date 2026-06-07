import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Settings, LogOut, LayoutDashboard, Database } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // කුමන ටැබ් එකද පෙන්වන්නේ

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'settings', name: 'App Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-8">Admin Panel</h1>
        <nav className="flex-1 space-y-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === item.id ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
            >
              <item.icon size={20} /> {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-red-300 hover:text-red-100">
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <h1 className="text-2xl font-bold">Dashboard Summary</h1>}
        {activeTab === 'users' && <h1 className="text-2xl font-bold">User Management (අලුත් යූසර්ලා ඇඩ් කරන තැන)</h1>}
        {/* අනිත් ටැබ් ටිකත් මෙතන හදමු */}
      </div>
    </div>
  );
}