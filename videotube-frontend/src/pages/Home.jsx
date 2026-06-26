import { useState, useEffect } from 'react'
import { videoService } from '../services'
import VideoCard from '../components/video/VideoCard'
import { getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Home.css'

const CATEGORIES = ['All', 'Gaming', 'Music', 'Sports', 'Tech', 'Travel', 'Food', 'Education', 'Comedy']

export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showWakeupMessage, setShowWakeupMessage] = useState(false)

  useEffect(() => {
    fetchVideos(1, true)
  }, [category])

  useEffect(() => {
    let timer
    if (loading) {
      timer = setTimeout(() => {
        setShowWakeupMessage(true)
      }, 5000)
    } else {
      setShowWakeupMessage(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  const fetchVideos = async (p = 1, reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: p, limit: 12, sortBy: 'createdAt', sortType: 'desc' }
      if (category !== 'All') params.tag = category
      const { data } = await videoService.getAllVideos(params)
      const docs = data.data.docs || []
      setVideos((prev) => reset ? docs : [...prev, ...docs])
      setHasMore(data.data.hasNextPage)
      setPage(p)
    } catch (err) {
      setError(err)
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="home-page">
      {/* Category chips */}
      <div className="category-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero section */}
      {page === 1 && !loading && !error && videos.length > 0 && (
        <HeroVideo video={videos[0]} />
      )}

      {/* Section header */}
      <div className="section-header">
        <h2 className="section-title">{category === 'All' ? 'LATEST VIDEOS' : category.toUpperCase()}</h2>
        <span className="text-dim mono" style={{ fontSize: 13 }}>{videos.length} videos</span>
      </div>

      {/* Video grid */}
      {loading && videos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {showWakeupMessage && (
            <div className="wakeup-warning-banner" style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              color: '#eab308',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              alignItems: 'center',
              margin: '0 auto 16px',
              maxWidth: 600,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>⏳ Connecting to Server...</span>
              <span>The backend is hosted on a free tier and is waking up. This first load can take up to a minute. Thank you for your patience!</span>
            </div>
          )}
          <div className="video-grid">
            {Array.from({ length: 8 }).map((_, i) => <VideoSkeleton key={i} />)}
          </div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <h3>Failed to load videos</h3>
          <p style={{ maxWidth: 400, margin: '0 auto 16px' }}>
            {getApiError(error) || 'The server took too long to respond. It may still be starting up.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => fetchVideos(1, true)}
            style={{ minWidth: 160 }}
          >
            Retry Connection
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📹</div>
          <h3>No videos yet</h3>
          <p>Be the first to upload something great</p>
        </div>
      ) : (
        <div className="video-grid">
          {(page === 1 ? videos.slice(1) : videos).map((v, i) => (
            <VideoCard key={v._id} video={v} style={{ animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      )}

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchVideos(page + 1)}
            disabled={loading}
            style={{ minWidth: 160 }}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'Load more'}
          </button>
        </div>
      )}
    </main>
  )
}

function HeroVideo({ video }) {
  return (
    <div className="hero-video">
      <img src={video.thumbnail} alt={video.title} className="hero-thumb" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="badge badge-accent" style={{ marginBottom: 12 }}>Featured</span>
        <h1 className="display hero-title">{video.title}</h1>
        <p className="hero-desc text-muted">{video.description?.slice(0, 120)}{video.description?.length > 120 ? '…' : ''}</p>
        <a href={`/watch/${video._id}`} className="btn btn-primary" style={{ width: 'fit-content', marginTop: 8 }}>
          ▶ Watch Now
        </a>
      </div>
    </div>
  )
}

function VideoSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%', borderRadius: 0 }} />
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 4 }} />
      </div>
    </div>
  )
}
