import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchAll } from '../utils/api';
import Loader from '../components/Layout/Loader';
import { AiOutlineSearch } from 'react-icons/ai';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchAll(query);
        setResults(data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <AiOutlineSearch className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search users, hashtags..."
          className={styles.searchInput}
          autoFocus
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')}>×</button>
        )}
      </div>

      <div className={styles.results}>
        {loading && <div className={styles.center}><Loader size="md" /></div>}

        {!loading && results && (
          <>
            {results.users?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>People</h3>
                {results.users.map(u => (
                  <Link key={u._id} to={`/${u.username}`} className={styles.userRow}>
                    <img src={u.profilePic} alt="" className={`avatar ${styles.avatar}`} />
                    <div>
                      <div className={styles.username}>
                        {u.username}
                        {u.isVerified && <span className={styles.verified}>✓</span>}
                      </div>
                      <div className={styles.meta}>
                        {u.fullName && <span>{u.fullName}</span>}
                        <span>{u.followers?.length || 0} followers</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results.hashtags?.length > 0 && results.hashtags[0].count > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Hashtags</h3>
                {results.hashtags.map(h => (
                  <div key={h.tag} className={styles.hashtagRow}>
                    <div className={styles.hashtagIcon}>#</div>
                    <div>
                      <div className={styles.hashtagName}>#{h.tag}</div>
                      <div className={styles.hashtagCount}>{h.count} posts & reels</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.users?.length === 0 && results.hashtags?.every(h => !h.count) && (
              <div className={styles.empty}>
                <p>No results for "<strong>{query}</strong>"</p>
              </div>
            )}
          </>
        )}

        {!loading && !results && (
          <div className={styles.placeholder}>
            <AiOutlineSearch className={styles.placeholderIcon} />
            <p>Search for people and hashtags</p>
          </div>
        )}
      </div>
    </div>
  );
}
