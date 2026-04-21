import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AiFillHome, AiOutlineHome, AiFillCompass, AiOutlineCompass, AiOutlinePlus } from 'react-icons/ai';
import { BsFillCameraReelsFill, BsCameraReels } from 'react-icons/bs';
import styles from './MobileNav.module.css';

export default function MobileNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={styles.mobileNav}>
      <NavLink to="/" end className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        {({ isActive }) => isActive ? <AiFillHome /> : <AiOutlineHome />}
      </NavLink>

      <NavLink to="/explore" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        {({ isActive }) => isActive ? <AiFillCompass /> : <AiOutlineCompass />}
      </NavLink>

      <button className={`${styles.item} ${styles.createBtn}`} onClick={() => navigate('/upload/reel')}>
        <AiOutlinePlus />
      </button>

      <NavLink to="/reels" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        {({ isActive }) => isActive ? <BsFillCameraReelsFill /> : <BsCameraReels />}
      </NavLink>

      <NavLink to={`/${user?.username}`} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <img src={user?.profilePic} alt="" className={`avatar ${styles.avatar}`} />
      </NavLink>
    </nav>
  );
}
