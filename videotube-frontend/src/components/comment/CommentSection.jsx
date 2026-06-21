import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSend, FiEdit2, FiTrash2, FiHeart } from 'react-icons/fi'
import { commentService, likeService } from '../../services'
import useAuthStore from '../../store/authStore'
import { timeAgo, getApiError } from '../../utils/helpers'
import toast from 'react-hot-toast'
import './CommentSection.css'

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

function CommentItem({ comment, onDelete, onUpdate }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [liked, setLiked] = useState(comment.isLikedByUser)
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0)
  const [showLikePopover, setShowLikePopover] = useState(false)

  const isOwner = user?._id === comment.owner?._id

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLikePopover(true)
      return
    }
    try {
      setLiked((p) => !p)
      setLikesCount((p) => liked ? p - 1 : p + 1)
      await likeService.toggleCommentLike(comment._id)
    } catch { setLiked((p) => !p); setLikesCount((p) => liked ? p + 1 : p - 1) }
  }

  const handleEdit = async () => {
    if (!editText.trim()) return
    try {
      await commentService.updateComment(comment._id, { content: editText })
      onUpdate(comment._id, editText)
      setEditing(false)
      toast.success('Comment updated')
    } catch (err) { toast.error(getApiError(err)) }
  }

  const handleDelete = async () => {
    try {
      await commentService.deleteComment(comment._id)
      onDelete(comment._id)
      toast.success('Comment deleted')
    } catch (err) { toast.error(getApiError(err)) }
  }

  return (
    <div className="comment-item fade-up">
      <img src={comment.owner?.avatar} alt="" className="avatar avatar-sm" style={{ flexShrink: 0 }} />
      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-author">@{comment.owner?.username}</span>
          <span className="text-dim" style={{ fontSize: 12 }}>{timeAgo(comment.createdAt)}</span>
        </div>
        {editing ? (
          <div className="comment-edit">
            <textarea
              className="input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}
        <div className="comment-actions">
          <div className="auth-popover-wrapper">
            <button className={`comment-like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <FiHeart size={13} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            {showLikePopover && (
              <AuthPopover
                message="Sign in to Like this video."
                onClose={() => setShowLikePopover(false)}
              />
            )}
          </div>
          {isOwner && !editing && (
            <>
              <button className="comment-action-btn" onClick={() => setEditing(true)}><FiEdit2 size={13} /></button>
              <button className="comment-action-btn danger" onClick={handleDelete}><FiTrash2 size={13} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentSection({ videoId }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalDocs, setTotalDocs] = useState(0)
  const [showCommentPopover, setShowCommentPopover] = useState(false)

  useEffect(() => {
    fetchComments(1, true)
  }, [videoId])

  const fetchComments = async (p = 1, reset = false) => {
    setLoading(true)
    try {
      const { data } = await commentService.getVideoComments(videoId, { page: p, limit: 10 })
      const docs = data.data.docs || []
      setComments((prev) => reset ? docs : [...prev, ...docs])
      setHasMore(data.data.hasNextPage)
      setTotalDocs(data.data.totalDocs)
      setPage(p)
    } catch (err) { toast.error(getApiError(err)) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setShowCommentPopover(true)
      return
    }
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await commentService.addComment(videoId, { content: newComment })
      setComments((p) => [{ ...data.data, owner: { _id: user._id, username: user.username, avatar: user.avatar } }, ...p])
      setTotalDocs((p) => p + 1)
      setNewComment('')
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = (id) => {
    setComments((p) => p.filter((c) => c._id !== id))
    setTotalDocs((p) => p - 1)
  }

  const handleUpdate = (id, content) => {
    setComments((p) => p.map((c) => c._id === id ? { ...c, content } : c))
  }

  return (
    <div className="comment-section">
      <h3 className="comment-heading display">{totalDocs} COMMENTS</h3>

      <form className="comment-form" onSubmit={handleSubmit}>
        {isAuthenticated ? (
          <img src={user?.avatar} alt="" className="avatar avatar-sm" style={{ flexShrink: 0 }} />
        ) : (
          <div className="avatar avatar-sm" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', fontSize: 14 }}>👤</div>
        )}
        <div className="comment-input-wrap">
          <textarea
            className="input comment-input"
            placeholder="Add a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          {newComment.trim() && (
            <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewComment('')}>Cancel</button>
              <div className="auth-popover-wrapper">
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  <FiSend size={13} /> {submitting ? 'Posting…' : 'Comment'}
                </button>
                {showCommentPopover && (
                  <AuthPopover
                    message="Sign in to comment."
                    onClose={() => setShowCommentPopover(false)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="comment-list">
        {loading && comments.length === 0 ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3" style={{ padding: '12px 0' }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div className="flex-col gap-2 w-full">
                <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem key={c._id} comment={c} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      {hasMore && (
        <button
          className="btn btn-secondary w-full"
          onClick={() => fetchComments(page + 1)}
          disabled={loading}
        >
          {loading ? <span className="spinner spinner-sm" /> : 'Load more comments'}
        </button>
      )}
    </div>
  )
}
