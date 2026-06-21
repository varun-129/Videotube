// ── Liked Videos ────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { likeService } from '../services'
import VideoCard from '../components/video/VideoCard'
import { getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'

export function LikedVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    likeService.getLikedVideos()
      .then(({ data }) => setVideos(data.data || []))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 28 }}>
      <div className="section-header">
        <h1 className="section-title">LIKED VIDEOS</h1>
        <span className="badge badge-muted">{videos.length}</span>
      </div>
      {loading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : videos.length === 0 ? (
        <div className="empty-state"><div className="icon">👍</div><h3>No liked videos yet</h3></div>
      ) : (
        <div className="video-grid">{videos.map((v) => <VideoCard key={v._id} video={v} />)}</div>
      )}
    </div>
  )
}

// ── Watch History ────────────────────────────────────────────
import { authService } from '../services'

export function WatchHistory() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.getWatchHistory()
      .then(({ data }) => setVideos(data.data || []))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 28 }}>
      <div className="section-header">
        <h1 className="section-title">WATCH HISTORY</h1>
        <span className="badge badge-muted">{videos.length}</span>
      </div>
      {loading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : videos.length === 0 ? (
        <div className="empty-state"><div className="icon">🕐</div><h3>No history yet</h3><p>Watch some videos to see them here</p></div>
      ) : (
        <div className="video-grid">{videos.map((v) => <VideoCard key={v._id} video={v} />)}</div>
      )}
    </div>
  )
}

// ── Playlists ────────────────────────────────────────────────
import { playlistService } from '../services'
import useAuthStore from '../store/authStore'
import { FiPlus, FiList } from 'react-icons/fi'

export function Playlists() {
  const { user } = useAuthStore()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [activePlaylist, setActivePlaylist] = useState(null)

  useEffect(() => {
    if (user?._id) {
      playlistService.getUserPlaylists(user._id)
        .then(({ data }) => setPlaylists(data.data || []))
        .catch((err) => toast.error(getApiError(err)))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      const { data } = await playlistService.createPlaylist(form)
      setPlaylists((p) => [data.data, ...p])
      setForm({ name: '', description: '' })
      setCreating(false)
      toast.success('Playlist created!')
    } catch (err) { toast.error(getApiError(err)) }
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="section-header">
        <h1 className="section-title">PLAYLISTS</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating((p) => !p)}>
          <FiPlus size={14} /> New Playlist
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="card fade-up" style={{ padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My awesome playlist" required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's this playlist about?" />
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Create</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : playlists.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No playlists yet</h3><p>Create your first playlist to organize videos</p></div>
      ) : (
        <div className="video-grid">
          {playlists.map((pl) => (
            <div key={pl._id} className="card playlist-card fade-up" onClick={() => setActivePlaylist(pl)}>
              <div className="playlist-thumb-wrap">
                {pl.videos?.[0]?.thumbnail
                  ? <img src={pl.videos[0].thumbnail} alt="" className="playlist-thumb" />
                  : <div className="playlist-thumb-empty"><FiList size={32} className="text-dim" /></div>
                }
                <div className="playlist-count">{pl.totalVideos || 0} videos</div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{pl.name}</div>
                {pl.description && <div className="text-dim" style={{ fontSize: 12, marginTop: 3 }}>{pl.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activePlaylist && (
        <div className="modal-overlay" onClick={() => setActivePlaylist(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{activePlaylist.name}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setActivePlaylist(null)}>✕</button>
            </div>
            {activePlaylist.description && (
              <p className="text-dim" style={{ fontSize: 14, marginBottom: 16, marginTop: -12 }}>{activePlaylist.description}</p>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {activePlaylist.videos && activePlaylist.videos.length > 0 ? (
                activePlaylist.videos.map((vid) => (
                  <div key={vid._id} className="playlist-video-item flex gap-3" style={{ padding: 8, borderRadius: 'var(--radius)', background: 'var(--bg-2)', transition: 'var(--transition)', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to={`/watch/${vid._id}`} className="flex gap-3 w-full" style={{ minWidth: 0 }} onClick={() => setActivePlaylist(null)}>
                      <div style={{ position: 'relative', width: 120, aspectRatio: '16/9', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={vid.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, justifyContent: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-0)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {vid.title}
                        </div>
                        <div className="text-dim" style={{ fontSize: 12 }}>@{vid.owner?.username || vid.owner}</div>
                      </div>
                    </Link>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      style={{ color: 'var(--red)', flexShrink: 0 }}
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await playlistService.removeVideoFromPlaylist(activePlaylist._id, vid._id)
                          toast.success('Video removed from playlist')
                          
                          // Update active playlist state locally
                          const updatedVideos = activePlaylist.videos.filter(v => v._id !== vid._id)
                          setActivePlaylist(prev => ({
                            ...prev,
                            videos: updatedVideos,
                            totalVideos: updatedVideos.length
                          }))
                          
                          // Update playlists list page state locally
                          setPlaylists(prevList => prevList.map(pl => {
                            if (pl._id === activePlaylist._id) {
                              return {
                                ...pl,
                                videos: updatedVideos,
                                totalVideos: updatedVideos.length
                              }
                            }
                            return pl
                          }))
                        } catch (err) {
                          toast.error(getApiError(err))
                        }
                      }}
                      title="Remove from playlist"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p>No videos in this playlist yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tweets ───────────────────────────────────────────────────
import { tweetService } from '../services'
import { FiTrash2, FiEdit2 } from 'react-icons/fi'
import { timeAgo } from '../utils/helpers'

export function Tweets() {
  const { user } = useAuthStore()
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    if (user?._id) {
      tweetService.getUserTweets(user._id)
        .then(({ data }) => setTweets(data.data || []))
        .catch((err) => toast.error(getApiError(err)))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const { data } = await tweetService.createTweet({ content })
      setTweets((p) => [data.data, ...p])
      setContent('')
      toast.success('Tweet posted!')
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    try {
      await tweetService.deleteTweet(id)
      setTweets((p) => p.filter((t) => t._id !== id))
      toast.success('Tweet deleted')
    } catch (err) { toast.error(getApiError(err)) }
  }

  const handleUpdate = async (id) => {
    try {
      await tweetService.updateTweet(id, { content: editText })
      setTweets((p) => p.map((t) => t._id === id ? { ...t, content: editText } : t))
      setEditing(null)
      toast.success('Tweet updated')
    } catch (err) { toast.error(getApiError(err)) }
  }

  return (
    <div style={{ padding: 28, maxWidth: 680 }}>
      <div className="section-header"><h1 className="section-title">TWEETS</h1></div>

      <form onSubmit={handlePost} className="card" style={{ padding: 18, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <img src={user?.avatar} alt="" className="avatar avatar-sm" />
        <div style={{ flex: 1 }}>
          <textarea
            className="input"
            rows={3}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !content.trim()}>
              {submitting ? <span className="spinner spinner-sm" /> : 'Post Tweet'}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : tweets.length === 0 ? (
        <div className="empty-state"><div className="icon">🐦</div><h3>No tweets yet</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tweets.map((t) => (
            <div key={t._id} className="card fade-up" style={{ padding: '18px 20px' }}>
              <div className="flex gap-3">
                <img src={user?.avatar} alt="" className="avatar avatar-sm" />
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>@{user?.username}</span>
                      <span className="text-dim" style={{ fontSize: 12 }}>{timeAgo(t.createdAt)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditing(t._id); setEditText(t.content) }}><FiEdit2 size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(t._id)}><FiTrash2 size={13} /></button>
                    </div>
                  </div>
                  {editing === t._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="input" rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(t._id)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6 }}>{t.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
