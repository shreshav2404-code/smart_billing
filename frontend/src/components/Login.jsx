import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.user?.role || 'customer');
      if (res.data.user?.id) {
        localStorage.setItem('userId', res.data.user.id);
      }
      navigate('/products');
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await axios.post('/api/auth/guest-login');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', 'customer');
      if (res.data.user?.id) {
        localStorage.setItem('userId', res.data.user.id);
      }
      navigate('/products');
    } catch (err) {
      alert('Guest login failed');
    }
  };

  const handleOwnerLogin = async () => {
    try {
      const res = await axios.post('/api/auth/owner-login');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', 'owner');
      navigate('/owner-dashboard');
    } catch (err) {
      alert('Owner login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
        <p className="text-slate-500 mt-2 text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <input 
            type="email" 
            id="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <input 
            type="password" 
            id="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button 
          type="submit" 
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign In
        </button>
      </form>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button 
          type="button" 
          onClick={handleGuestLogin} 
          className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Continue as Guest
        </button>
        <button 
          type="button" 
          onClick={handleOwnerLogin} 
          className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          Login as Owner
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <button 
          onClick={() => navigate('/register')} 
          className="font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
        >
          Register here
        </button>
      </div>
    </div>
  );
};

export default Login;