import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiBell, FiGrid, FiTwitter, FiList, FiUsers } from 'react-icons/fi'
import { authService, subscriptionService, tweetService, videoService } from '../services'
import useAuthStore from '../store/authStore'
import VideoCard from '../components/video/VideoCard'
import { formatViews, timeAgo, getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Channel.css'

const TABS = [
  { id: 'videos', label: 'Videos', icon: FiGrid },
  { id: 'tweets', label: 'Tweets', icon: FiTwitter },
  { id: 'playlists', label: 'Playlists', icon: FiList },
  { id: 'about', label: 'About', icon: FiUsers },
]

function AuthPopover({ message, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="auth-popover">
      <button className="auth-popover-close" onClick={onClose}>✕</button>
      <p className="auth-popover-text">{message}</p>
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')} style={{ width: '100%' }}>
        Sign In
      </button>
    </div>
  )
}

export default function Channel() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: me, isAuthenticated } = useAuthStore()
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('videos')
  const [videos, setVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount] = useState(0)
  const [showSubPopover, setShowSubPopover] = useState(false)

  useEffect(() => {
    loadChannel()
  }, [username])

  useEffect(() => {
    if (channel) {
      if (tab === 'videos') loadVideos()
      if (tab === 'tweets') loadTweets()
    }
  }, [tab, channel])

  const loadChannel = async () => {
    setLoading(true)
    try {
      const { data } = await authService.getChannelProfile(username)
      const ch = data.data
      setChannel(ch)
      setSubscribed(ch.isSubscribed)
      setSubCount(ch.subscribersCount || 0)
    } catch (err) { toast.error(getApiError(err)) }
    finally { setLoading(false) }
  }

  const loadVideos = async () => {
    try {
      const { data } = await videoService.getAllVideos({ userId: channel._id, limit: 20 })
      setVideos(data.data.docs || [])
    } catch { }
  }

  const loadTweets = async () => {
    try {
      const { data } = await tweetService.getUserTweets(channel._id)
      setTweets(data.data || [])
    } catch { }
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setShowSubPopover(true)
      return
    }
    const prev = subscribed
    setSubscribed(!prev)
    setSubCount((p) => prev ? p - 1 : p + 1)
    try {
      await subscriptionService.toggleSubscription(channel._id)
      toast.success(prev ? 'Unsubscribed' : 'Subscribed!')
    } catch {
      setSubscribed(prev)
      setSubCount((p) => prev ? p + 1 : p - 1)
    }
  }

  if (loading) return (
    <div className="channel-page">
      <div className="skeleton" style={{ height: 220, borderRadius: 0 }} />
      <div style={{ padding: 24, display: 'flex', gap: 20 }}>
        <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 24, width: '40%' }} />
          <div className="skeleton" style={{ height: 14, width: '25%' }} />
        </div>
      </div>
    </div>
  )

  if (!channel) return <div className="empty-state"><h3>Channel not found</h3></div>

  const isOwner = me?.username === username

  return (
    <div className="channel-page">
      {/* Cover */}
      <div className="channel-cover">
        {channel.coverImage
          ? <img src={channel.coverImage} alt="" className="channel-cover-img" />
          : <div className="channel-cover-placeholder" />
        }
      </div>

      {/* Info */}
      <div className="channel-info">
        <div className="channel-identity">
          <img src={channel.avatar} alt="" className="avatar avatar-2xl channel-avatar" />
          <div>
            <h1 className="channel-name">{channel.fullName}</h1>
            <div className="flex gap-3 items-center" style={{ marginTop: 4, flexWrap: 'wrap' }}>
              <span className="text-dim" style={{ fontSize: 14 }}>@{channel.username}</span>
              <span className="text-dim">·</span>
              <span className="text-dim" style={{ fontSize: 14 }}>
                {formatViews(subCount)} subscribers
              </span>
              <span className="text-dim">·</span>
              <span className="text-dim" style={{ fontSize: 14 }}>
                {formatViews(channel.channelsSubscribedToCount)} subscribed
              </span>
            </div>
          </div>
        </div>

        <div className="channel-actions">
          {!isOwner && (
            <div className="auth-popover-wrapper">
              <button
                className={`btn ${subscribed ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleSubscribe}
              >
                {subscribed ? <><FiBell size={14} /> Subscribed</> : 'Subscribe'}
              </button>
              {showSubPopover && (
                <AuthPopover
                  message="Sign in to subscribe."
                  onClose={() => setShowSubPopover(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="channel-tabs-wrap">
        <div className="channel-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`channel-tab ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="channel-content">
        {tab === 'videos' && (
          videos.length === 0
            ? <div className="empty-state"><div className="icon">📹</div><h3>No videos yet</h3></div>
            : <div className="video-grid">{videos.map((v) => <VideoCard key={v._id} video={v} />)}</div>
        )}

        {tab === 'tweets' && (
          <div className="tweets-list">
            {tweets.length === 0
              ? <div className="empty-state"><div className="icon">🐦</div><h3>No tweets yet</h3></div>
              : tweets.map((t) => (
                <div key={t._id} className="tweet-card card">
                  <div className="flex gap-3">
                    <img src={channel.avatar} alt="" className="avatar avatar-sm" />
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>@{channel.username}</span>
                        <span className="text-dim" style={{ fontSize: 12 }}>{timeAgo(t.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6 }}>{t.content}</p>
                      <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                        <span className="badge badge-muted">{t.likesCount || 0} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'about' && (
          <div className="about-card card" style={{ padding: 28 }}>
            <h2 className="display" style={{ fontSize: 22, marginBottom: 20 }}>ABOUT</h2>
            <div className="about-grid">
              <div><span className="label">Email</span><span>{channel.email}</span></div>
              <div><span className="label">Subscribers</span><span>{formatViews(subCount)}</span></div>
              <div><span className="label">Subscribed to</span><span>{formatViews(channel.channelsSubscribedToCount)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
