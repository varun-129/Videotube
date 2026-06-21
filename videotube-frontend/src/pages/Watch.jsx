import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiThumbsUp, FiShare2, FiBookmark, FiMoreHorizontal,
  FiEye, FiCalendar, FiBell
} from 'react-icons/fi'
import { videoService, likeService, subscriptionService } from '../services'
import useAuthStore from '../store/authStore'
import CommentSection from '../components/comment/CommentSection'
import VideoCard from '../components/video/VideoCard'
import { formatViews, formatDuration, timeAgo, getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Watch.css'

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

export default function Watch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [showLikePopover, setShowLikePopover] = useState(false)
  const [showSubPopover, setShowSubPopover] = useState(false)

  useEffect(() => {
    loadVideo()
    window.scrollTo(0, 0)
  }, [id])

  const loadVideo = async () => {
    setLoading(true)
    try {
      const { data } = await videoService.getVideoById(id)
      const v = data.data
      setVideo(v)
      setLiked(v.isLikedByUser)
      setLikesCount(v.likesCount || 0)
      setSubscribed(v.owner?.isSubscribed)
      setSubCount(v.owner?.subscribersCount || 0)

      // Related
      const relRes = await videoService.getAllVideos({ limit: 8, sortBy: 'createdAt' })
      setRelated((relRes.data.data.docs || []).filter((r) => r._id !== id))
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLikePopover(true)
      return
    }
    const prev = liked
    setLiked(!prev)
    setLikesCount((p) => prev ? p - 1 : p + 1)
    try {
      await likeService.toggleVideoLike(id)
    } catch {
      setLiked(prev)
      setLikesCount((p) => prev ? p + 1 : p - 1)
    }
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
      await subscriptionService.toggleSubscription(video.owner._id)
      toast.success(prev ? 'Unsubscribed' : 'Subscribed!')
    } catch {
      setSubscribed(prev)
      setSubCount((p) => prev ? p + 1 : p - 1)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
  }

  if (loading) return (
    <div className="watch-page">
      <div className="watch-main">
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 22, width: '70%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )

  if (!video) return (
    <div className="watch-page">
      <div className="empty-state"><h3>Video not found</h3></div>
    </div>
  )

  return (
    <div className="watch-page">
      <div className="watch-main">
        {/* Player */}
        <div className="player-wrap">
          <video
            src={video.videFile}
            poster={video.thumbnail}
            controls
            className="player"
            autoPlay
          />
        </div>

        {/* Title */}
        <h1 className="watch-title">{video.title}</h1>

        {/* Meta bar */}
        <div className="watch-meta-bar">
          <div className="watch-stats flex gap-3 items-center">
            <span className="flex items-center gap-1 text-dim" style={{ fontSize: 13 }}>
              <FiEye size={14} /> {formatViews(video.views)} views
            </span>
            <span className="text-dim">·</span>
            <span className="flex items-center gap-1 text-dim" style={{ fontSize: 13 }}>
              <FiCalendar size={14} /> {timeAgo(video.createdAt)}
            </span>
          </div>

          <div className="watch-actions flex gap-2">
            <div className="auth-popover-wrapper">
              <button
                className={`action-btn ${liked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <FiThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                <span>{formatViews(likesCount)}</span>
              </button>
              {showLikePopover && (
                <AuthPopover 
                  message="Sign in to like this video." 
                  onClose={() => setShowLikePopover(false)} 
                />
              )}
            </div>
            <button className="action-btn" onClick={handleShare}>
              <FiShare2 size={16} /> Share
            </button>
            <button className="action-btn">
              <FiBookmark size={16} /> Save
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Channel info */}
        <div className="channel-row">
          <Link to={`/channel/${video.owner?.username}`} className="channel-link">
            <img src={video.owner?.avatar} alt="" className="avatar avatar-lg" />
            <div>
              <div className="channel-name">{video.owner?.fullName}</div>
              <div className="text-dim" style={{ fontSize: 13 }}>
                {formatViews(subCount)} subscribers
              </div>
            </div>
          </Link>

          {user?._id !== video.owner?._id && (
            <div className="auth-popover-wrapper">
              <button
                className={`btn ${subscribed ? 'btn-secondary subscribed' : 'btn-primary'}`}
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

        {/* Description */}
        <div className="description-box">
          <p className={`description-text ${descExpanded ? 'expanded' : ''}`}>
            {video.description || 'No description provided.'}
          </p>
          {video.description?.length > 160 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 6, padding: '4px 0' }}
              onClick={() => setDescExpanded((p) => !p)}
            >
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div className="divider" />

        {/* Comments */}
        <CommentSection videoId={id} />
      </div>

      {/* Related sidebar */}
      <aside className="watch-sidebar">
        <h3 className="display" style={{ fontSize: 18, letterSpacing: '0.04em', marginBottom: 16 }}>
          UP NEXT
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {related.map((v) => (
            <RelatedCard key={v._id} video={v} />
          ))}
        </div>
      </aside>
    </div>
  )
}

function RelatedCard({ video }) {
  return (
    <Link to={`/watch/${video._id}`} className="related-card">
      <div className="related-thumb-wrap">
        <img src={video.thumbnail} alt={video.title} className="related-thumb" />
        <span className="related-duration mono">{formatDuration(video.duration)}</span>
      </div>
      <div className="related-info">
        <div className="related-title line-clamp-2">{video.title}</div>
        <div className="text-dim" style={{ fontSize: 12 }}>@{video.owner?.username}</div>
        <div className="text-dim" style={{ fontSize: 12 }}>{formatViews(video.views)} views</div>
      </div>
    </Link>
  )
}
