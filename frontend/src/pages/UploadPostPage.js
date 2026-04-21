import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../utils/api';
import { toast } from 'react-toastify';
import { AiOutlineCloudUpload, AiOutlinePlus } from 'react-icons/ai';
import { BsShieldCheck } from 'react-icons/bs';
import styles from './UploadPage.module.css';

const SCAN_IDLE     = 'idle';
const SCAN_SCANNING = 'scanning';
const SCAN_PASSED   = 'passed';
const SCAN_FAILED   = 'failed';

export default function UploadPostPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [form, setForm]             = useState({ caption: '', hashtags: '', location: '' });
  const [loading, setLoading]       = useState(false);
  const [activePreview, setActivePreview] = useState(0);
  const [scanState, setScanState]   = useState(SCAN_IDLE);
  const [scanMessage, setScanMessage] = useState('');

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 10) return toast.error('Max 10 images allowed');
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setMediaFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setScanState(SCAN_IDLE);
    setScanMessage('');
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (activePreview >= index && activePreview > 0) setActivePreview(v => v - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaFiles.length === 0) return toast.error('Please select at least one image');

    setLoading(true);
    setScanState(SCAN_SCANNING);
    setScanMessage(`🤖 AI is scanning ${mediaFiles.length > 1 ? `all ${mediaFiles.length} images` : 'your image'} for content safety...`);

    try {
      const formData = new FormData();
      mediaFiles.forEach(f => formData.append('media', f));
      formData.append('caption',  form.caption);
      formData.append('hashtags', form.hashtags);
      formData.append('location', form.location);

      await createPost(formData);

      setScanState(SCAN_PASSED);
      setScanMessage('✅ Content scan passed! Post created successfully.');
      toast.success('Post created!');
      navigate('/');
    } catch (err) {
      const msg     = err.response?.data?.message || 'Upload failed';
      const flagged = err.response?.data?.flagged;

      if (flagged) {
        setScanState(SCAN_FAILED);
        setScanMessage(msg);
        toast.error(msg, { autoClose: 8000 });
      } else {
        setScanState(SCAN_IDLE);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderScanBanner = () => {
    if (scanState === SCAN_IDLE) return null;

    const bannerStyle = {
      padding: '12px 16px', borderRadius: '8px', marginBottom: '12px',
      fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
      background: scanState === SCAN_SCANNING ? 'rgba(59,130,246,0.12)'
                : scanState === SCAN_PASSED   ? 'rgba(34,197,94,0.12)'
                : 'rgba(239,68,68,0.12)',
      border: `1px solid ${
        scanState === SCAN_SCANNING ? '#3b82f6'
        : scanState === SCAN_PASSED ? '#22c55e'
        : '#ef4444'
      }`,
      color: scanState === SCAN_SCANNING ? '#3b82f6'
           : scanState === SCAN_PASSED   ? '#22c55e'
           : '#ef4444',
    };

    return (
      <div style={bannerStyle}>
        {scanState === SCAN_SCANNING && <span>⟳</span>}
        {scanState === SCAN_PASSED   && <BsShieldCheck />}
        {scanState === SCAN_FAILED   && <span>⚠️</span>}
        <span>{scanMessage}</span>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Create Post</h1>
          <p>Share photos with your followers</p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20, padding: '4px 12px', marginTop: 8, fontSize: 12, color: '#22c55e',
          }}>
            <BsShieldCheck /> AI Content Moderation Active
          </div>
        </div>

        <div className={styles.content}>
          {previews.length === 0 ? (
            <div
              className={styles.uploadArea}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length) handleFilesChange({ target: { files } });
              }}
            >
              <div className={styles.uploadPlaceholder}>
                <div className={styles.uploadIcon}><AiOutlineCloudUpload /></div>
                <h3>Drag & drop photos here</h3>
                <p>or click to browse files</p>
                <span className={styles.fileHint}>JPG, PNG, WEBP up to 10MB each · Max 10 photos</span>
                <button className="btn-primary" type="button">Select Photos</button>
              </div>
            </div>
          ) : (
            <div className={styles.previewArea}>
              <div className={styles.mainPreview}>
                <img src={previews[activePreview]} alt="" className={styles.previewImage} />
              </div>
              <div className={styles.thumbnailRow}>
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className={`${styles.thumb} ${i === activePreview ? styles.activeThumb : ''}`}
                    onClick={() => setActivePreview(i)}
                  >
                    <img src={src} alt="" />
                    <button
                      className={styles.removeThumb}
                      onClick={ev => { ev.stopPropagation(); removeMedia(i); }}
                    >×</button>
                  </div>
                ))}
                {previews.length < 10 && (
                  <button
                    className={styles.addMoreBtn}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <AiOutlinePlus />
                  </button>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            style={{ display: 'none' }}
          />

          {/* AI scan state banner */}
          {renderScanBanner()}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Caption</label>
              <textarea
                value={form.caption}
                onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                placeholder="Write a caption..."
                maxLength={2200}
                className={styles.textarea}
                rows={4}
              />
              <span className={styles.charCount}>{form.caption.length}/2200</span>
            </div>

            <div className={styles.field}>
              <label>Hashtags</label>
              <input
                value={form.hashtags}
                onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
                placeholder="#photography, #jioreels"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Add location"
                className={styles.input}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || mediaFiles.length === 0 || scanState === SCAN_FAILED}
              >
                {loading ? 'Posting & Scanning...' : 'Share Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
