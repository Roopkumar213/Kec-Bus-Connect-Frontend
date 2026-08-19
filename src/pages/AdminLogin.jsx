import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, ArrowLeft, Radio } from 'lucide-react';
import { api } from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@kec.ac.in');
  const [password, setPassword] = useState('Roop@210307');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in as admin or driver
  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (token) {
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'driver' || role === 'tracker') {
        navigate('/driver/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginRes = await api.login(email.trim(), password.trim());
      if (loginRes.success && loginRes.user) {
        const userRole = (loginRes.user.role || '').toLowerCase();
        
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'driver' || userRole === 'tracker') {
          navigate('/driver/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setError(loginRes.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          fontWeight: 500
        }}
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="auth-card animate-fade-in" style={{ borderTop: '4px solid var(--primary)' }}>
        <div className="auth-header">
          <div
            className="profile-avatar"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', margin: '0 auto' }}
          >
            <Shield size={32} />
          </div>
          <h2>Staff & Driver Portal</h2>
          <p>Sign in to manage bus routes and broadcast live GPS</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            border: '1px solid hsl(350, 80%, 90%)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="staff-email">Account Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="staff-email"
                type="text"
                className="form-control"
                placeholder="admin@kec.ac.in or driver@kec.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="staff-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="staff-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn btn-lg"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            <LogIn size={16} />
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          <span>Are you a student? </span>
          <Link to="/student-login" style={{ fontWeight: 600 }}>
            Student Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
