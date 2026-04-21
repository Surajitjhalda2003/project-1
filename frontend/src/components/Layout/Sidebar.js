import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  AiFillHome, AiOutlineHome, AiFillCompass, AiOutlineCompass,
  AiFillBell, AiOutlineBell, AiOutlineSearch, AiOutlinePlus,
  AiOutlineMessage, AiFillMessage,
} from 'react-icons/ai';
import { BsFillCameraReelsFill, BsCameraReels, BsMoon, BsSun } from 'react-icons/bs';
import { RiLogoutBoxLine } from 'react-icons/ri';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const navItems = [
    { to: '/', icon: <AiOutlineHome />, activeIcon: <AiFillHome />, label: 'Home' },
    { to: '/search', icon: <AiOutlineSearch />, activeIcon: <AiOutlineSearch />, label: 'Search' },
    { to: '/explore', icon: <AiOutlineCompass />, activeIcon: <AiFillCompass />, label: 'Explore' },
    { to: '/reels', icon: <BsCameraReels />, activeIcon: <BsFillCameraReelsFill />, label: 'Reels' },
    { to: '/chat', icon: <AiOutlineMessage />, activeIcon: <AiFillMessage />, label: 'Messages' },
    { to: '/notifications', icon: <AiOutlineBell />, activeIcon: <AiFillBell />, label: 'Notifications' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} onClick={() => navigate('/')}>
        <span className={`${styles.logoText} gradient-text`}>JIOREELS</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className={styles.navIcon}>{isActive ? item.activeIcon : item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Upload button */}
        <div className={styles.uploadWrapper}>
          <button className={styles.navItem} onClick={() => setShowUploadMenu(v => !v)}>
            <span className={styles.navIcon}><AiOutlinePlus /></span>
            <span className={styles.navLabel}>Create</span>
          </button>
          {showUploadMenu && (
            <div className={styles.uploadMenu}>
              <button onClick={() => { navigate('/upload/reel'); setShowUploadMenu(false); }}>
                <BsCameraReels /> Upload Reel
              </button>
              <button onClick={() => { navigate('/upload/post'); setShowUploadMenu(false); }}>
                <AiOutlinePlus /> Upload Post
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.bottom}>
        <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <BsSun /> : <BsMoon />}
        </button>

        <NavLink
          to={`/${user?.username}`}
          className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.active : ''}`}
        >
          <img src={user?.profilePic} alt={user?.username} className={`avatar ${styles.profilePic}`} width={28} height={28} />
          <span className={styles.navLabel}>{user?.username}</span>
        </NavLink>

        <button className={styles.logoutBtn} onClick={logout} title="Logout">
          <RiLogoutBoxLine />
        </button>
      </div>
    </aside>
  );
}
