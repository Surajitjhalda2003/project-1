import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from './Auth.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, fullName } = form;
    if (!username || !email || !password) return toast.error('Please fill all required fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ username, email, password, fullName });
      toast.success('Welcome to JIOREELS!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 }}>Share your world, one reel at a time</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.brandHeader}>
            <h1 className={`gradient-text ${styles.brandName}`}>JIOREELS</h1>
            <p className={styles.tagline}>Sign up to see videos from your friends.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className={styles.input} />
            <input name="username" placeholder="Username *" value={form.username} onChange={handleChange} className={styles.input} required />
            <input type="email" name="email" placeholder="Email *" value={form.email} onChange={handleChange} className={styles.input} required />
            <input type="password" name="password" placeholder="Password *" value={form.password} onChange={handleChange} className={styles.input} required />

            <p className={styles.terms}>
              By signing up, you agree to our <a href="#!">Terms</a>, <a href="#!">Privacy Policy</a> and <a href="#!">Cookies Policy</a>.
            </p>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.switchLink}>
            Have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
