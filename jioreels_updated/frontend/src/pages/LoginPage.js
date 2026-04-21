import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from './Auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.leftPanel}>
        <div className={styles.phoneFrame}>
          <div className={styles.reelPreview}>
            <div className={styles.reelOverlay}>
              <span className="gradient-text" style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne' }}>JIOREELS</span>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 }}>India's own Reels platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.brandHeader}>
            <h1 className={`gradient-text ${styles.brandName}`}>JIOREELS</h1>
            <p className={styles.tagline}>Capture. Create. Connect.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                autoComplete="email"
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <div className={styles.divider}><span>OR</span></div>

          <div className={styles.switchLink}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
