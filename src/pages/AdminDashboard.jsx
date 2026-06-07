import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Settings, LogOut, LayoutDashboard, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // මුලින්ම User Management ටැබ් එක පෙන්වයි

  // අලුත් යූසර් කෙනෙක් ඇඩ් කිරීම සඳහා අවශ්‍ය States
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'settings', name: 'App Settings', icon: Settings },
  ];

  // අලුත් ඩ්‍රයිවර් කෙනෙක් ඩේටාබේස් එකට යැවීම
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/register-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`සාර්ථකයි! ${data.username} ගේ ගිණුම සාදන ලදී. එය ${data.valid_until} දක්වා (මාසයක්) වලංගුයි.`);
        setNewUsername('');
        setNewPassword('');
      } else {
        setError(data.error || 'ලියාපදිංචි කිරීම අසාර්ථකයි.');
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setError('සර්වර් එක හා සම්බන්ධ වීමේ දෝෂයක්.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#14348c] text-white p-6 flex flex-col shadow-xl z-10">
        <h1 className="text-2xl font-bold mb-8 tracking-wide">Admin Panel</h1>
        <nav className="flex-1 space-y-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-white/20 shadow-md' : 'hover:bg-white/10'}`}
            >
              <item.icon size={20} /> {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-blue-200 hover:text-white transition-colors bg-white/5 hover:bg-red-500/80 rounded-xl mt-auto">
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Summary</h1>
            <p className="text-gray-600">මෙතනට අපි ඉදිරියේදී මුළු සාරාංශයම ගේමු.</p>
          </div>
        )}

        {/* User Management Section */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            
            {/* Add New User Card */}
            <div className="max-w-md bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-[#14348c] mb-6 flex items-center gap-2">
                <UserPlus size={24} /> නව රියදුරු ගිණුමක් සෑදීම
              </h2>

              {message && (
                <div className="mb-5 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg font-medium text-sm shadow-sm">
                  {message}
                </div>
              )}
              {error && (
                <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-medium text-sm shadow-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">පරිශීලක නාමය (Username)</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 transition-colors"
                    placeholder="උදා: kamal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">මුරපදය (Password)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14348c] focus:outline-none bg-gray-50 transition-colors"
                    placeholder="අවම අකුරු/ඉලක්කම් 6ක්..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold transition-all duration-300 shadow-md ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#14348c] hover:bg-blue-800 hover:shadow-lg'}`}
                >
                  {isLoading ? 'ගිණුම සාදමින් පවතී...' : 'නව ගිණුම සාදන්න'}
                </button>
              </form>
            </div>
            
            {/* මෙතනට අපි ඊළඟට ඉන්න යූසර්ලගේ ලිස්ට් එක (Table) එක ගේමු */}
            
          </div>
        )}

      </div>
    </div>
  );
}