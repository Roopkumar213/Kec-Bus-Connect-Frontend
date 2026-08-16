import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bus, Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

const StudentLogin = () => {
  const [email, setEmail] = useState('student@kec.ac.in');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem('kec_current_user');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && user && role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [navigate]);

  // Read success notification from signup redirect
  useEffect(() => {
    const msg = localStorage.getItem('signup_success_msg');
    if (msg) {
      setSuccessMsg(msg);
      localStorage.removeItem('signup_success_msg');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const loginRes = await api.login(email.trim(), password.trim());
      if (loginRes.success) {
        // Fetch student profile details from Spring Boot
        try {
          const meData = await api.getMe();
          const studentProfile = meData.student || {
            fullName: meData.user?.email?.split('@')[0] || 'Student',
            studentId: '22KEC401',
            email: meData.user?.email,
          };
          localStorage.setItem('kec_current_user', JSON.stringify(studentProfile));
        } catch (meErr) {
          localStorage.setItem('kec_current_user', JSON.stringify({
            fullName: email.split('@')[0],
            studentId: '22KEC401',
            email: email.trim(),
          }));
        }

        navigate('/student/dashboard');
      } else {
        setError(loginRes.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please check your credentials.');
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

      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div
            className="profile-avatar"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', margin: '0 auto' }}
          >
            <Bus size={32} />
          </div>
          <h2>Student Portal</h2>
          <p>Sign in to track college buses and routes</p>
        </div>

        {/* Success notification */}
        {successMsg && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            border: '1px solid hsl(150, 75%, 90%)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            border: '1px solid hsl(350, 80%, 90%)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="email@kec.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex'
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn btn-lg"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            <LogIn size={16} />
            {isLoading ? 'Signing in…' : 'Login as Student'}
          </button>
        </form>

        <div className="auth-switch" style={{ marginBottom: '16px' }}>
          <span>Don't have an account? </span>
          <Link to="/student-signup" style={{ fontWeight: 600 }}>
            Create Account
          </Link>
        </div>

        <div className="auth-switch" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span>Driver or Administrator? </span>
          <Link to="/admin-login" style={{ fontWeight: 600 }}>
            Staff / Driver Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
export { StudentLogin };
