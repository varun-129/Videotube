import { useState, useRef } from 'react'
import { FiX, FiUploadCloud, FiImage } from 'react-icons/fi'
import { videoService } from '../../services'
import toast from 'react-hot-toast'
import './UploadModal.css'

export default function UploadModal({ onClose }) {
  const [step, setStep] = useState(1) // 1=pick, 2=details, 3=uploading
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', tag: '' })
  const [progress, setProgress] = useState(0)
  const videoRef = useRef()
  const thumbRef = useRef()

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoFile(file)
    setForm((f) => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }))
    setStep(2)
  }

  const handleThumbChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!videoFile) return toast.error('Video file required')
    if (!form.title.trim()) return toast.error('Title required')
    if (!form.tag) return toast.error('Category is required')
    setStep(3)
    const fd = new FormData()
    fd.append('videoFile', videoFile)
    if (thumbnail) {
      fd.append('thumbnail', thumbnail)
    }
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('tag', form.tag)
    try {
      await videoService.publishVideo(fd, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      toast.success('Video uploaded!')
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
      setStep(2)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal upload-modal">
        <div className="modal-header">
          <h2 className="modal-title display">
            {step === 1 ? 'UPLOAD VIDEO' : step === 2 ? 'VIDEO DETAILS' : 'UPLOADING…'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {step === 1 && (
          <div className="upload-drop" onClick={() => videoRef.current.click()}>
            <FiUploadCloud size={48} className="text-accent" />
            <p style={{ fontSize: 16, fontWeight: 500 }}>Click to select video</p>
            <p className="text-dim" style={{ fontSize: 13 }}>MP4, MOV, AVI, WebM supported</p>
            <input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideoChange} />
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="upload-form">
            {/* Thumbnail */}
            <div className="thumb-upload" onClick={() => thumbRef.current.click()}>
              {thumbnailPreview
                ? <img src={thumbnailPreview} alt="" className="thumb-preview" />
                : (
                  <div className="thumb-placeholder">
                    <FiImage size={28} className="text-dim" />
                    <span className="text-dim" style={{ fontSize: 13 }}>Select thumbnail (optional)</span>
                  </div>
                )
              }
              <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumbChange} />
            </div>

            <div className="upload-fields">
              <div>
                <label className="label">Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Give your video a title"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Tell viewers about your video"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Category / Tag *</label>
                <select
                  className="input"
                  value={form.tag}
                  onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
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
              <div className="upload-file-name text-dim mono" style={{ fontSize: 12 }}>
                📹 {videoFile?.name}
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish</button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="upload-progress">
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-muted" style={{ fontSize: 14, textAlign: 'center' }}>
              {progress}% — Please don't close this window
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
