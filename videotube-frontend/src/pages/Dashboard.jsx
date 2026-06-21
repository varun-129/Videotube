import { useState, useEffect } from 'react'
import { FiEye, FiUsers, FiVideo, FiHeart, FiTrash2, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { dashboardService, videoService } from '../services'
import { formatViews, timeAgo, getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Dashboard.css'
import EditModal from '../components/video/EditModal'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`stat-card card fade-up ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <div className="stat-value display">{formatViews(value)}</div>
        <div className="stat-label text-dim">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, videosRes] = await Promise.all([
        dashboardService.getChannelStats(),
        dashboardService.getChannelVideos(),
      ])
      setStats(statsRes.data.data)
      setVideos(videosRes.data.data || [])
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return
    try {
      await videoService.deleteVideo(id)
      setVideos((p) => p.filter((v) => v._id !== id))
      toast.success('Video deleted')
    } catch (err) { toast.error(getApiError(err)) }
  }

  const handleToggle = async (id, isPublished) => {
    const action = isPublished ? 'make this video private' : 'make this video public'
    if (!confirm(`Are you sure you want to ${action}?`)) return
    try {
      await videoService.togglePublish(id)
      setVideos((p) => p.map((v) => v._id === id ? { ...v, isPublished: !v.isPublished } : v))
      toast.success(isPublished ? 'Video is now private' : 'Video is now public')
    } catch (err) { toast.error(getApiError(err)) }
  }

  if (loading) return (
    <div className="dashboard-page">
      <div className="page-loader"><span className="spinner" /></div>
    </div>
  )

  return (
    <div className="dashboard-page">
      <div className="section-header">
        <h1 className="section-title">DASHBOARD</h1>
        <span className="badge badge-accent">Channel Analytics</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={FiEye} label="Total Views" value={stats?.totalViews} accent />
        <StatCard icon={FiUsers} label="Subscribers" value={stats?.totalSubscribers} />
        <StatCard icon={FiVideo} label="Videos" value={stats?.totalVideos} />
        <StatCard icon={FiHeart} label="Total Likes" value={stats?.totalLikes} />
      </div>

      {/* Video table */}
      <div style={{ marginTop: 12 }}>
        <h2 className="display" style={{ fontSize: 20, letterSpacing: '0.04em', marginBottom: 16 }}>
          YOUR VIDEOS
        </h2>
        {videos.length === 0 ? (
          <div className="empty-state"><div className="icon">📹</div><h3>No videos uploaded yet</h3></div>
        ) : (
          <div className="video-table">
            <div className="video-table-head">
              <span>Video</span>
              <span>Status</span>
              <span>Views</span>
              <span>Likes</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            {videos.map((v) => (
              <div key={v._id} className="video-table-row fade-up">
                <div className="video-table-info">
                  <img src={v.thumbnail} alt="" className="video-table-thumb" />
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{v.title}</div>
                    <div className="text-dim" style={{ fontSize: 12 }}>{v.description?.slice(0, 60)}…</div>
                  </div>
                </div>
                <div>
                  <span className={`badge ${v.isPublished ? 'badge-accent' : 'badge-muted'}`}>
                    {v.isPublished ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: 14 }}>{formatViews(v.views)}</div>
                <div className="text-muted" style={{ fontSize: 14 }}>{formatViews(v.likesCount)}</div>
                <div className="text-dim" style={{ fontSize: 12 }}>{timeAgo(v.createdAt)}</div>
                <div className="video-table-actions">
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title={v.isPublished ? 'Make Private' : 'Make Public'}
                    onClick={() => handleToggle(v._id, v.isPublished)}
                  >
                    {v.isPublished ? <FiToggleRight size={18} style={{ color: 'var(--accent)' }} /> : <FiToggleLeft size={18} />}
                  </button>
                  <button 
                    className="btn btn-ghost btn-icon btn-sm" 
                    title="Edit"
                    onClick={() => setEditingVideo(v)}
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Delete"
                    style={{ color: 'var(--red)' }}
                    onClick={() => handleDelete(v._id)}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingVideo && (
        <EditModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onUpdate={(updatedVideo) => {
            setVideos((p) => p.map((v) => v._id === updatedVideo._id ? { ...v, ...updatedVideo } : v))
          }}
        />
      )}
    </div>
  )
}
