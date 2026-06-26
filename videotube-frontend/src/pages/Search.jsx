import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { videoService } from '../services'
import VideoCard from '../components/video/VideoCard'
import { getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalDocs, setTotalDocs] = useState(0)

  useEffect(() => {
    if (query) search()
  }, [query])

  const search = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await videoService.getAllVideos({ query, limit: 20 })
      setVideos(data.data.docs || [])
      setTotalDocs(data.data.totalDocs || 0)
    } catch (err) {
      setError(err)
      toast.error(getApiError(err))
    }
    finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">SEARCH RESULTS</h1>
          {!loading && !error && (
            <p className="text-dim" style={{ fontSize: 13, marginTop: 4 }}>
              {totalDocs} results for "{query}"
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : error ? (
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <h3>Failed to search videos</h3>
          <p style={{ maxWidth: 400, margin: '0 auto 16px' }}>
            {getApiError(error) || 'The server took too long to respond. It may still be starting up.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={search}
            style={{ minWidth: 160 }}
          >
            Retry Search
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <FiSearch size={40} style={{ opacity: 0.3 }} />
          <h3>No results found</h3>
          <p>Try different keywords or browse the home page</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <VideoCard key={v._id} video={v} style={{ animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}
