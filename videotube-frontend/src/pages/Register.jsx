import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUser, FiAtSign, FiCamera } from 'react-icons/fi'
import useAuthStore from '../store/authStore'
import { getApiError } from '../utils/helpers'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Register() {
  const { register } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const avatarRef = useRef()
  const coverRef = useRef()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCover = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = form.email.trim()
    const trimmedUsername = form.username.trim()
    const trimmedFullName = form.fullName.trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return toast.error('Please enter a valid email address')
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('fullName', trimmedFullName)
      fd.append('username', trimmedUsername)
      fd.append('email', trimmedEmail)
      fd.append('password', form.password)
      if (avatar) fd.append('avatar', avatar)
      if (coverImage) fd.append('coverImage', coverImage)
      await register(fd)
      toast.success('Welcome to VideoTube!')
      navigate('/')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card auth-card-wide fade-up">
        <div className="auth-logo">
          <span className="logo-icon-lg">▶</span>
          <span className="display" style={{ fontSize: 28, letterSpacing: '0.06em' }}>VIDEOTUBE</span>
        </div>

        <h1 className="auth-heading display">CREATE ACCOUNT</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Cover image */}
          <div className="cover-upload-wrap" onClick={() => coverRef.current.click()}>
            {coverPreview
              ? <img src={coverPreview} alt="" className="cover-preview" />
              : <div className="cover-placeholder"><FiCamera size={20} className="text-dim" /><span className="text-dim" style={{ fontSize: 12 }}>Add cover image (optional)</span></div>
            }
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
          </div>

          {/* Avatar */}
          <div className="avatar-upload-row">
            <div className="avatar-upload" onClick={() => avatarRef.current.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="avatar-upload-preview" />
                : <FiCamera size={22} className="text-dim" />
              }
              <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
            </div>
            <span className="text-dim" style={{ fontSize: 13 }}>
              {avatarPreview ? 'Click to change avatar' : 'Upload avatar (optional)'}
            </span>
          </div>

          <div className="register-grid">
            <div>
              <label className="label">Full Name</label>
              <div className="input-wrap input-icon-left">
                <FiUser className="icon" size={15} />
                <input className="input" placeholder="John Doe" value={form.fullName} onChange={set('fullName')} required />
              </div>
            </div>
            <div>
              <label className="label">Username</label>
              <div className="input-wrap input-icon-left">
                <FiAtSign className="icon" size={15} />
                <input className="input" placeholder="johndoe" value={form.username} onChange={set('username')} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="input-wrap input-icon-left">
                <FiMail className="icon" size={15} />
                <input className="input" type="text" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="input-wrap input-icon-left">
                <FiLock className="icon" size={15} />
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="text-dim" style={{ fontSize: 14 }}>Already have an account?</span>
          <Link to="/login" className="auth-link">Sign in →</Link>
        </div>
      </div>
    </div>
  )
}
