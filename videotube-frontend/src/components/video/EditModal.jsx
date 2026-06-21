import { useState, useRef } from 'react'
import { FiX, FiImage } from 'react-icons/fi'
import { videoService } from '../../services'
import toast from 'react-hot-toast'
import './UploadModal.css'

export default function EditModal({ video, onClose, onUpdate }) {
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnail)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description || '')
  const [tag, setTag] = useState(video.tag || '')
  const [loading, setLoading] = useState(false)
  const thumbRef = useRef()

  const handleThumbChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Title is required')
    if (!tag) return toast.error('Category is required')
    setLoading(true)

    const fd = new FormData()
    fd.append('title', title)
    fd.append('description', description)
    fd.append('tag', tag)
    if (thumbnail) {
      fd.append('thumbnail', thumbnail)
    }

    try {
      const { data } = await videoService.updateVideo(video._id, fd)
      toast.success('Video updated successfully!')
      onUpdate(data.data)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal upload-modal">
        <div className="modal-header">
          <h2 className="modal-title display">EDIT VIDEO DETAILS</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={loading}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Thumbnail */}
          <div className="thumb-upload" onClick={() => !loading && thumbRef.current.click()}>
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="" className="thumb-preview" />
            ) : (
              <div className="thumb-placeholder">
                <FiImage size={28} className="text-dim" />
                <span className="text-dim" style={{ fontSize: 13 }}>Select thumbnail</span>
              </div>
            )}
            <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumbChange} />
          </div>

          <div className="upload-fields">
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a title"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={4}
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Category / Tag *</label>
              <select
                className="input"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={loading}
                required
                style={{ background: '#0f0f0f', color: '#fff', border: '1px solid #272727', padding: '10px 12px', borderRadius: '6px', width: '100%', outline: 'none' }}
              >
                <option value="">Select</option>
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
                <option value="Sports">Sports</option>
                <option value="Tech">Tech</option>
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
                <option value="Education">Education</option>
                <option value="Comedy">Comedy</option>
              </select>
            </div>
            <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
