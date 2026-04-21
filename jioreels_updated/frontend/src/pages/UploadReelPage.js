import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReel } from '../utils/api';
import { toast } from 'react-toastify';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { BsMusicNote, BsShieldCheck } from 'react-icons/bs';
import styles from './UploadPage.module.css';

// Scan states for the UI
const SCAN_IDLE     = 'idle';
const SCAN_SCANNING = 'scanning';
const SCAN_PASSED   = 'passed';
const SCAN_FAILED   = 'failed';

export default function UploadReelPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile]       = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [form, setForm]                 = useState({ caption: '', hashtags: '', audio: '' });
  const [loading, setLoading]           = useState(false);
  const [scanState, setScanState]       = useState(SCAN_IDLE);
  const [scanMessage, setScanMessage]   = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, MOV, AVI, WEBM)');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setScanState(SCAN_IDLE);
    setScanMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setScanState(SCAN_IDLE);
    } else {
      toast.error('Please drop a video file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return toast.error('Please select a video');

    setLoading(true);
    setScanState(SCAN_SCANNING);
    setScanMessage('🤖 AI is scanning your video for content safety...');

    try {
      const formData = new FormData();
      formData.append('video',    videoFile);
      formData.append('caption',  form.caption);
      formData.append('hashtags', form.hashtags);
      formData.append('audio',    form.audio || 'Original Audio');

      await uploadReel(formData);

      setScanState(SCAN_PASSED);
      setScanMessage('✅ Content scan passed! Reel uploaded successfully.');
      toast.success('Reel uploaded successfully! 🎬');
      navigate('/reels');
    } catch (err) {
      const msg  = err.response?.data?.message || 'Upload failed. Please try again.';
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

  // Scan state banner
  const renderScanBanner = () => {
    if (scanState === SCAN_IDLE) return null;

    const bannerStyle = {
      padding:      '12px 16px',
      borderRadius: '8px',
      marginTop:    '12px',
      fontSize:     '14px',
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
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
        {scanState === SCAN_SCANNING && (
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
        )}
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
          <h1>Create Reel</h1>
          <p>Share a short video with your followers</p>
          {/* AI Moderation badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20, padding: '4px 12px', marginTop: 8, fontSize: 12, color: '#22c55e',
          }}>
            <BsShieldCheck /> AI Content Moderation Active
          </div>
        </div>

        <div className={styles.content}>
          {/* Upload / Preview area */}
          <div
            className={`${styles.uploadArea} ${videoPreview ? styles.hasPreview : ''}`}
            onClick={() => !videoPreview && fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {videoPreview ? (
              <div className={styles.preview}>
                <video
                  src={videoPreview}
                  controls
                  className={styles.previewVideo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  className={styles.changeBtn}
                  onClick={e => {
                    e.stopPropagation();
                    setVideoFile(null);
                    setVideoPreview(null);
                    setScanState(SCAN_IDLE);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Change Video
                </button>
              </div>
            ) : (
              <div className={styles.uploadPlaceholder}>
                <div className={styles.uploadIcon}><AiOutlineCloudUpload /></div>
                <h3>Drag & drop your video here</h3>
                <p>or click to browse files</p>
                <span className={styles.fileHint}>MP4, MOV, AVI, WEBM · Max 100MB</span>
                <button className="btn-primary" type="button">Select Video</button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* AI scan state banner */}
          {renderScanBanner()}

          {/* Progress bar while loading */}
          {loading && scanState === SCAN_SCANNING && (
            <div style={{
              width: '100%', height: 4, background: 'var(--bg-tertiary)',
              borderRadius: 4, overflow: 'hidden', marginTop: 8,
            }}>
              <div style={{
                height: '100%', background: 'var(--brand-gradient)',
                width: '70%', transition: 'width 0.4s ease',
              }} />
            </div>
          )}

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
                rows={3}
              />
              <span className={styles.charCount}>{form.caption.length}/2200</span>
            </div>

            <div className={styles.field}>
              <label>Hashtags</label>
              <input
                value={form.hashtags}
                onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
                placeholder="#trending, #jioreels, #viral"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label><BsMusicNote /> Audio name</label>
              <input
                value={form.audio}
                onChange={e => setForm(f => ({ ...f, audio: e.target.value }))}
                placeholder="Original Audio"
                className={styles.input}
              />
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
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !videoFile || scanState === SCAN_FAILED}
              >
                {loading ? 'Uploading & Scanning...' : 'Share Reel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
