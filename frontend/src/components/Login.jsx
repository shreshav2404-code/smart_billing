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
      navigate('/products');
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await axios.post('/api/auth/guest-login');
      localStorage.setItem('token', res.data.token);
      navigate('/products');
    } catch (err) {
      alert('Guest login failed');
    }
  };

  const handleOwnerLogin = async () => {
    try {
      const res = await axios.post('/api/auth/owner-login');
      localStorage.setItem('token', res.data.token);
      navigate('/owner-dashboard');
    } catch (err) {
      alert('Owner login failed');
    }
  };

  return (
    <div>
      <h2>Login to Your Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button type="button" onClick={handleGuestLogin} style={{ backgroundColor: '#28a745', flex: 1 }}>
          Continue as Guest
        </button>
        <button type="button" onClick={handleOwnerLogin} style={{ backgroundColor: '#f39c12', flex: 1 }}>
          Login as Store Owner
        </button>
      </div>
      <p>Don't have an account? <button onClick={() => navigate('/register')}>Register here</button></p>
    </div>
  );
};

export default Login;