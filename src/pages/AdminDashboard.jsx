import { useState } from 'react';

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Flask Backend එකට ඩේටා යැවීම
      const response = await fetch('https://delivery-app-backend-coral.vercel.app/api/admin/register-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // රෙජිස්ටර් වීම සාර්ථක නම්
        setMessage(`සාර්ථකයි! ${data.username} ගේ ගිණුම ${data.valid_until} දක්වා වලංගුයි.`);
        setUsername(''); // ෆෝම් එක හිස් කිරීම
        setPassword('');
      } else {
        // මොකක් හරි වැරැද්දක් නම් (උදා: නම කලින් අරන් නම්)
        setError(data.error || 'ලියාපදිංචි කිරීම අසාර්ථකයි.');
      }
    } catch (err) {
      setError('සර්වර් එකට සම්බන්ධ වීමට නොහැක. Backend එක run වෙනවාදැයි පරීක්ෂා කරන්න.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 mt-10">
        <h1 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">පරිපාලක පුවරුව (Admin Dashboard)</h1>
        
        <h2 className="text-lg font-semibold text-blue-800 mb-4">නව රියදුරු ගිණුමක් සෑදීම</h2>

        {/* සාර්ථක වූ විට පෙන්වන පණිවිඩය */}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            {message}
          </div>
        )}

        {/* අසාර්ථක වූ විට පෙන්වන පණිවිඩය */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">රියදුරුගේ නම (Username)</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="උදා: kamal_driver"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">මුරපදය (Password)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="අවම අකුරු/ඉලක්කම් 6ක්"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-lg shadow-md transition duration-300 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-700'}`}
          >
            {isLoading ? 'ලියාපදිංචි කරමින්...' : 'ලියාපදිංචි කරන්න'}
          </button>
        </form>
      </div>
    </div>
  );
}