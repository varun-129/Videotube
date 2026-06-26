import { useState, useEffect } from 'react'
import { FiFilter, FiTrendingUp, FiClock, FiEye } from 'react-icons/fi'
import { videoService } from '../services'
import VideoCard from '../components/video/VideoCard'
import { getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Explore.css'

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest',   icon: FiClock },
  { value: 'views-desc',     label: 'Most Viewed', icon: FiEye },
  { value: 'createdAt-asc',  label: 'Oldest',   icon: FiTrendingUp },
]

export default function Explore() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('createdAt-desc')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal]   = useState(0)

  useEffect(() => { fetchVideos(1, true) }, [sort])

  const fetchVideos = async (p = 1, reset = false) => {
    setLoading(true)
    setError(null)
    const [sortBy, sortType] = sort.split('-')
    try {
      const { data } = await videoService.getAllVideos({ page: p, limit: 16, sortBy, sortType })
      const docs = data.data.docs || []
      setVideos(prev => reset ? docs : [...prev, ...docs])
      setHasMore(data.data.hasNextPage)
      setTotal(data.data.totalDocs || 0)
      setPage(p)
    } catch (err) {
      setError(err)
      toast.error(getApiError(err))
    }
    finally { setLoading(false) }
  }

  return (
    <div className="explore-page">
      {/* Header bar */}
      <div className="explore-header">
        <div>
          <h1 className="section-title">EXPLORE</h1>
          {!loading && !error && (
            <p className="text-dim" style={{ fontSize: 13, marginTop: 4 }}>
              {total.toLocaleString()} videos
            </p>
          )}
        </div>

        <div className="sort-bar">
          <FiFilter size={14} className="text-dim" />
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={`sort-btn ${sort === value ? 'active' : ''}`}
              onClick={() => setSort(value)}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && videos.length === 0 ? (
        <div className="video-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
              <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 11, width: '55%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
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
          <div className="icon">🎬</div>
          <h3>No videos yet</h3>
          <p>Be the first to upload something amazing!</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <VideoCard key={v._id} video={v} style={{ animationDelay: `${(i % 16) * 0.04}s` }} />
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
    </div>
  )
}
