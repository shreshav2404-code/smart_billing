import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', { username, email, password });
      navigate('/login');
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
        <p className="text-slate-500 mt-2 text-sm">Join us and start shopping smarter</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
          <input 
            type="text" 
            id="username" 
            placeholder="Choose a username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
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
            placeholder="Create a password" 
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
          Register
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button 
          onClick={() => navigate('/login')} 
          className="font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
        >
          Login here
        </button>
      </div>
    </div>
  );
};

export default Register;