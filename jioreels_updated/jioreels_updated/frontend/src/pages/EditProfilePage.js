import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { editProfile } from '../utils/api';
import { toast } from 'react-toastify';
import { AiOutlineCamera } from 'react-icons/ai';
import styles from './EditProfilePage.module.css';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio:      user?.bio      || '',
    website:  user?.website  || '',
  });
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePic);
  const [loading, setLoading]             = useState(false);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // ✅ Validate it's actually an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ FIX: Build FormData correctly — field name must match multer's .single('profilePic')
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('username', form.username);
      formData.append('bio',      form.bio);
      formData.append('website',  form.website);
      if (avatarFile) {
        formData.append('profilePic', avatarFile); // must match multer field name
      }

      const { data } = await editProfile(formData);
      updateUser(data.user);
      toast.success('Profile updated!');
      navigate(`/${data.user.username}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Edit Profile</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Avatar section */}
          <div
            className={styles.avatarSection}
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className={styles.avatarWrapper}>
              <img
                src={avatarPreview}
                alt={user?.username}
                className={`avatar ${styles.avatar}`}
                onError={e => { e.target.src = 'https://via.placeholder.com/64'; }}
              />
              <div className={styles.avatarOverlay}>
                <AiOutlineCamera className={styles.cameraIcon} />
              </div>
            </div>
            <div>
              <p className={styles.username}>{user?.username}</p>
              <span className={styles.changePhotoBtn}>Change profile photo</span>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />

          <div className={styles.divider} />

          {[
            { name: 'fullName', label: 'Full Name', placeholder: 'Your full name' },
            { name: 'username', label: 'Username',  placeholder: 'username' },
            { name: 'website',  label: 'Website',   placeholder: 'https://yourwebsite.com' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className={styles.field}>
              <label className={styles.label}>{label}</label>
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={styles.input}
              />
            </div>
          ))}

          <div className={styles.field}>
            <label className={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell people about yourself..."
              maxLength={150}
              className={styles.textarea}
              rows={3}
            />
            <span className={styles.charCount}>{form.bio.length}/150</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
