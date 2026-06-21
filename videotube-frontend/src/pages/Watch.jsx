import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiMoreHorizontal,
  FiEye, FiCalendar, FiBell
} from 'react-icons/fi'
import { videoService, likeService, subscriptionService, playlistService } from '../services'
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
  const [disliked, setDisliked] = useState(false)
  const [likePopoverMessage, setLikePopoverMessage] = useState('Sign in to like this video.')
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [showLikePopover, setShowLikePopover] = useState(false)
  const [showSubPopover, setShowSubPopover] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSavePopover, setShowSavePopover] = useState(false)

  useEffect(() => {
    loadVideo()
    window.scrollTo(0, 0)
    const localDisliked = localStorage.getItem(`disliked_video_${id}`) === 'true'
    setDisliked(localDisliked)
  }, [id])

  useEffect(() => {
    if (isAuthenticated && video?._id) {
      checkIfSaved()
    } else {
      setSaved(false)
    }
  }, [isAuthenticated, video, id])

  const checkIfSaved = async () => {
    try {
      const { data } = await playlistService.getUserPlaylists(user._id)
      const playlists = data.data || []
      const savedPlaylist = playlists.find(p => p.name === 'Saved Videos')
      if (savedPlaylist) {
        const isVideoInPlaylist = savedPlaylist.videos?.some(v => v._id === id || v === id)
        setSaved(isVideoInPlaylist)
      }
    } catch {
      // Fail silently
    }
  }

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
      setLikePopoverMessage('Sign in to like this video.')
      setShowLikePopover(true)
      return
    }
    const prevLiked = liked
    const prevDisliked = disliked
    
    setLiked(!prevLiked)
    setLikesCount((p) => prevLiked ? p - 1 : p + 1)
    
    if (disliked) {
      setDisliked(false)
      localStorage.setItem(`disliked_video_${id}`, 'false')
    }
    
    try {
      await likeService.toggleVideoLike(id)
    } catch {
      setLiked(prevLiked)
      setLikesCount((p) => prevLiked ? p + 1 : p - 1)
      setDisliked(prevDisliked)
      localStorage.setItem(`disliked_video_${id}`, String(prevDisliked))
    }
  }

  const handleDislike = async () => {
    if (!isAuthenticated) {
      setLikePopoverMessage('Sign in to dislike this video.')
      setShowLikePopover(true)
      return
    }
    const prevLiked = liked
    const prevDisliked = disliked
    
    const newDisliked = !prevDisliked
    setDisliked(newDisliked)
    localStorage.setItem(`disliked_video_${id}`, String(newDisliked))
    
    if (liked) {
      setLiked(false)
      setLikesCount((p) => p - 1)
      try {
        await likeService.toggleVideoLike(id)
      } catch {
        setLiked(prevLiked)
        setLikesCount((p) => p + 1)
        setDisliked(prevDisliked)
        localStorage.setItem(`disliked_video_${id}`, String(prevDisliked))
      }
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

  const handleSave = async () => {
    if (!isAuthenticated) {
      setShowSavePopover(true)
      return
    }
    
    const prevSaved = saved
    setSaved(!prevSaved)
    
    try {
      const { data } = await playlistService.getUserPlaylists(user._id)
      const playlists = data.data || []
      let savedPlaylist = playlists.find(p => p.name === 'Saved Videos')
      
      if (!savedPlaylist) {
        const createRes = await playlistService.createPlaylist({
          name: 'Saved Videos',
          description: 'My saved videos'
        })
        savedPlaylist = createRes.data.data
      }
      
      if (prevSaved) {
        await playlistService.removeVideoFromPlaylist(savedPlaylist._id, id)
        toast.success('Removed from Saved Videos')
      } else {
        await playlistService.addVideoToPlaylist(savedPlaylist._id, id)
        toast.success('Saved to Saved Videos')
      }
    } catch (err) {
      setSaved(prevSaved)
      toast.error(getApiError(err))
    }
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

        {/* Description */}
        <div
          className={`description-box ${descExpanded ? 'expanded' : 'collapsed'}`}
          onClick={() => !descExpanded && setDescExpanded(true)}
          style={{ cursor: !descExpanded ? 'pointer' : 'default' }}
        >
          <p className="description-text">
            {video.description || 'No description provided.'}
          </p>
          {!descExpanded && (
            <span className="more-btn">...more</span>
          )}
          {descExpanded && (
            <button
              className="btn btn-ghost btn-sm less-btn"
              style={{ marginTop: 6, padding: '4px 0', display: 'block' }}
              onClick={(e) => {
                e.stopPropagation()
                setDescExpanded(false)
              }}
            >
              Show less
            </button>
          )}
        </div>

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

          <div className="watch-actions flex gap-4">
            <div className="auth-popover-wrapper">
              <div className="like-dislike-group">
                <button
                  className={`like-btn ${liked ? 'active' : ''}`}
                  onClick={handleLike}
                  title="I like this"
                >
                  <FiThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                  <span>{formatViews(likesCount)}</span>
                </button>
                <div className="like-dislike-divider" />
                <button
                  className={`dislike-btn ${disliked ? 'active' : ''}`}
                  onClick={handleDislike}
                  title="I dislike this"
                >
                  <FiThumbsDown size={16} fill={disliked ? 'currentColor' : 'none'} />
                </button>
              </div>
              {showLikePopover && (
                <AuthPopover 
                  message={likePopoverMessage} 
                  onClose={() => setShowLikePopover(false)} 
                />
              )}
            </div>
            
            <button className="action-btn" onClick={handleShare}>
              <FiShare2 size={16} /> Share
            </button>
            <div className="auth-popover-wrapper">
              <button
                className={`action-btn ${saved ? 'active' : ''}`}
                onClick={handleSave}
              >
                <FiBookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>
              {showSavePopover && (
                <AuthPopover 
                  message="Sign in to save this video." 
                  onClose={() => setShowSavePopover(false)} 
                />
              )}
            </div>
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
