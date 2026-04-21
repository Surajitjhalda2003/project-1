import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPost } from '../utils/api';
import PostCard from '../components/Posts/PostCard';
import Loader from '../components/Layout/Loader';
import styles from './PostDetailPage.module.css';

export default function PostDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getPost(id);
        setPost(data.post);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className={styles.loading}><Loader size="lg" /></div>;
  if (!post) return (
    <div className={styles.notFound}>
      <h2>Post not found</h2>
      <Link to="/" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>Go Home</Link>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PostCard
          post={post}
          onDelete={() => navigate('/')}
        />
      </div>
    </div>
  );
}
