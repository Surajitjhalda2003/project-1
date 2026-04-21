import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getConversations, getConversation, sendMessage, searchAll } from '../utils/api';
import Loader from '../components/Layout/Loader';
import { format } from 'timeago.js';
import {
  AiOutlineSend, AiOutlineArrowLeft,
  AiOutlineEdit, AiOutlineSearch, AiOutlineClose,
} from 'react-icons/ai';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { userId }                          = useParams();
  const { user }                            = useAuth();
  const { socket, onlineUsers }             = useSocket();
  const [conversations, setConversations]   = useState([]);
  const [activeConv, setActiveConv]         = useState(null);
  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);

  // New message modal state
  const [showNewMsg, setShowNewMsg]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);

  const messagesEndRef = useRef(null);
  const searchTimer    = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getConversations();
        setConversations(data.conversations);
        if (userId) {
          const { data: convData } = await getConversation(userId);
          setActiveConv(convData.conversation);
          setMessages(convData.conversation.messages || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !activeConv) return;
    socket.emit('join_conversation', activeConv._id);
    const handleMsg = ({ message }) => setMessages(m => [...m, message]);
    socket.on('new_message', handleMsg);
    return () => {
      socket.off('new_message', handleMsg);
      socket.emit('leave_conversation', activeConv._id);
    };
  }, [socket, activeConv]);

  // Live user search for new message
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await searchAll(searchQuery, 'users');
        setSearchResults(data.results?.users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    setSending(true);
    try {
      const { data } = await sendMessage(activeConv._id, { text });
      setMessages(m => [...m, data.message]);
      setText('');
      // Update last message in list
      setConversations(prev =>
        prev.map(c =>
          c._id === activeConv._id
            ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const openConversation = (conv) => {
    setActiveConv(conv);
    setMessages(conv.messages || []);
  };

  const startNewConversation = async (targetUser) => {
    setShowNewMsg(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    try {
      const { data } = await getConversation(targetUser._id);
      const conv = data.conversation;
      // Add to list if not already there
      setConversations(prev =>
        prev.find(c => c._id === conv._id) ? prev : [conv, ...prev]
      );
      setActiveConv(conv);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conv) =>
    conv.participants?.find(p => p._id !== user?._id);

  if (loading) return <div className={styles.loading}><Loader size="lg" /></div>;

  return (
    <div className={styles.page}>
      {/* ── Conversations list ───────────────────────────────────── */}
      <div className={`${styles.convList} ${activeConv ? styles.hidden : ''}`}>
        <div className={styles.convHeader}>
          <h2>{user?.username}</h2>
          <button
            className={styles.newMsgBtn}
            onClick={() => setShowNewMsg(true)}
            title="New message"
          >
            <AiOutlineEdit />
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className={styles.empty}>
            <p>No messages yet</p>
            <button className={styles.startBtn} onClick={() => setShowNewMsg(true)}>
              Send your first message
            </button>
          </div>
        ) : (
          conversations.map(conv => {
            const other    = getOtherUser(conv);
            const isOnline = onlineUsers.includes(other?._id);
            return (
              <div
                key={conv._id}
                className={`${styles.convItem} ${activeConv?._id === conv._id ? styles.activeConv : ''}`}
                onClick={() => openConversation(conv)}
              >
                <div className={styles.convAvatarWrap}>
                  <img src={other?.profilePic} alt="" className={`avatar ${styles.convAvatar}`} />
                  {isOnline && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.convInfo}>
                  <span className={styles.convName}>{other?.username}</span>
                  <span className={styles.convLastMsg}>{conv.lastMessage || 'Say hi!'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Chat area ───────────────────────────────────────────── */}
      <div className={`${styles.chatArea} ${!activeConv ? styles.hidden : ''}`}>
        {activeConv ? (
          <>
            <div className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => setActiveConv(null)}>
                <AiOutlineArrowLeft />
              </button>
              {(() => {
                const other    = getOtherUser(activeConv);
                const isOnline = onlineUsers.includes(other?._id);
                return (
                  <Link to={`/${other?.username}`} className={styles.chatUser}>
                    <div className={styles.chatAvatarWrap}>
                      <img src={other?.profilePic} alt="" className={`avatar ${styles.chatAvatar}`} />
                      {isOnline && <span className={styles.onlineDot} />}
                    </div>
                    <div>
                      <p className={styles.chatName}>{other?.username}</p>
                      <p className={styles.chatStatus}>{isOnline ? 'Active now' : 'Offline'}</p>
                    </div>
                  </Link>
                );
              })()}
            </div>

            <div className={styles.messages}>
              {messages.length === 0 && (
                <div className={styles.emptyChat}>
                  <p>No messages yet — say hello! 👋</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender === user?._id || msg.sender?._id === user?._id;
                return (
                  <div key={i} className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
                    <div className={`${styles.bubble} ${isMine ? styles.myBubble : styles.theirBubble}`}>
                      {msg.text}
                      <span className={styles.msgTime}>{format(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className={styles.inputRow}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Message..."
                className={styles.msgInput}
                disabled={sending}
              />
              <button type="submit" className={styles.sendBtn} disabled={!text.trim() || sending}>
                <AiOutlineSend />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <div className={styles.noChatIcon}>💬</div>
            <h3>Your Messages</h3>
            <p>Send private messages to your friends</p>
            <button className={styles.startBtn} onClick={() => setShowNewMsg(true)}>
              New Message
            </button>
          </div>
        )}
      </div>

      {/* ── New Message Modal ────────────────────────────────────── */}
      {showNewMsg && (
        <div className={styles.modalOverlay} onClick={() => setShowNewMsg(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>New Message</h3>
              <button className={styles.closeBtn} onClick={() => setShowNewMsg(false)}>
                <AiOutlineClose />
              </button>
            </div>

            <div className={styles.searchWrap}>
              <AiOutlineSearch className={styles.searchIcon} />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className={styles.searchInput}
              />
              {searching && <span className={styles.searchSpinner} />}
            </div>

            <div className={styles.searchResults}>
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className={styles.noResults}>No users found</p>
              )}
              {searchResults.length === 0 && !searchQuery && (
                <p className={styles.noResults}>Type a name to search</p>
              )}
              {searchResults.map(u => (
                <button
                  key={u._id}
                  className={styles.userResult}
                  onClick={() => startNewConversation(u)}
                >
                  <img src={u.profilePic} alt="" className={`avatar ${styles.resultAvatar}`} />
                  <div>
                    <span className={styles.resultName}>{u.username}</span>
                    {u.fullName && <span className={styles.resultFull}>{u.fullName}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
