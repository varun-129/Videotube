import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiUpload, FiBell, FiX, FiThumbsUp, FiTwitter } from 'react-icons/fi'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import UploadModal from '../video/UploadModal'
import { subscriptionService, videoService, tweetService } from '../../services'
import { timeAgo } from '../../utils/helpers'
import './Header.css'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      loadNotifications()
    } else {
      setNotifications([])
    }
  }, [isAuthenticated, user])

  const loadNotifications = async () => {
    try {
      const allNotifs = []
      
      // 1. Get user's subscriptions
      const subRes = await subscriptionService.getSubscribedChannels(user._id)
      const subChannels = subRes.data.data || []
      
      // Let's get recent videos and tweets from subscribed channels
      for (const ch of subChannels) {
        try {
          const { data } = await videoService.getAllVideos({ userId: ch.channel?._id, limit: 3 })
          const vids = data.data.docs || []
          vids.forEach((v) => {
            allNotifs.push({
              id: `vid_${v._id}`,
              type: 'video',
              text: `${ch.channel?.fullName || ch.channel?.username} uploaded a new video: "${v.title}"`,
              createdAt: new Date(v.createdAt),
              link: `/watch/${v._id}`,
              read: localStorage.getItem(`notif_read_vid_${v._id}`) === 'true',
              icon: FiUpload
            })
          })
        } catch {}

        try {
          const { data } = await tweetService.getUserTweets(ch.channel?._id)
          const tweets = data.data || []
          tweets.slice(0, 2).forEach((t) => {
            allNotifs.push({
              id: `tweet_${t._id}`,
              type: 'tweet',
              text: `${ch.channel?.fullName || ch.channel?.username} posted a tweet: "${t.content.slice(0, 40)}${t.content.length > 40 ? '...' : ''}"`,
              createdAt: new Date(t.createdAt),
              link: `/channel/${ch.channel?.username}`,
              read: localStorage.getItem(`notif_read_tweet_${t._id}`) === 'true',
              icon: FiTwitter
            })
          })
        } catch {}
      }

      // 2. Generate simulated activity on user's own channel (if they have videos)
      try {
        const myVidsRes = await videoService.getAllVideos({ userId: user._id, limit: 10 })
        const myVids = myVidsRes.data.data.docs || []
        
        const mockNames = ['Alice', 'Bob', 'Charlie', 'David', 'Emma']
        const mockComments = ['Awesome content, subbed!', 'This helped me a lot, thanks!', 'Great presentation!', 'Very helpful tips!']

        myVids.forEach((v, index) => {
          allNotifs.push({
            id: `like_mock_${v._id}`,
            type: 'like',
            text: `${mockNames[index % mockNames.length]} liked your video: "${v.title}"`,
            createdAt: new Date(new Date(v.createdAt).getTime() + 1000 * 60 * 30),
            link: `/watch/${v._id}`,
            read: localStorage.getItem(`notif_read_like_mock_${v._id}`) === 'true',
            icon: FiThumbsUp
          })

          allNotifs.push({
            id: `comment_mock_${v._id}`,
            type: 'comment',
            text: `${mockNames[(index + 1) % mockNames.length]} commented on your video: "${mockComments[index % mockComments.length]}"`,
            createdAt: new Date(new Date(v.createdAt).getTime() + 1000 * 60 * 60),
            link: `/watch/${v._id}`,
            read: localStorage.getItem(`notif_read_comment_mock_${v._id}`) === 'true',
            icon: FiBell
          })
        })
      } catch {}

      if (allNotifs.length === 0) {
        allNotifs.push({
          id: 'welcome_notif',
          type: 'welcome',
          text: `Welcome to VideoTube! Upload a video or subscribe to channels to get real-time notifications.`,
          createdAt: new Date(),
          link: '/',
          read: localStorage.getItem('notif_read_welcome_notif') === 'true',
          icon: FiBell
        })
      }

      allNotifs.sort((a, b) => b.createdAt - a.createdAt)
      setNotifications(allNotifs)
    } catch {}
  }

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      localStorage.setItem(`notif_read_${n.id}`, 'true')
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const handleNotifClick = (n) => {
    localStorage.setItem(`notif_read_${n.id}`, 'true')
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    )
    setNotifOpen(false)
    navigate(n.link)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
    setDropOpen(false)
  }

  return (
    <>
      <header className="header">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <span className="logo-icon">▶</span>
          <span className="display logo-text">VIDEOTUBE</span>
        </Link>

        {/* Search */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="input-wrap input-icon-left">
            <FiSearch className="icon" size={16} />
            <input
              ref={inputRef}
              className="input search-input"
              placeholder="Search videos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => { setQuery(''); inputRef.current.focus() }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
                <FiUpload size={14} /> Upload
              </button>
               <div className="notification-menu">
                <button
                  className={`btn btn-ghost btn-icon notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={() => setNotifOpen((p) => !p)}
                  title="Notifications"
                >
                  <FiBell size={18} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {notifOpen && (
                  <div className="notification-dropdown fade-in">
                    <div className="notification-header">
                      <span className="notification-title">Notifications</span>
                      {unreadCount > 0 && (
                        <button className="mark-read-btn" onClick={handleMarkAllRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="divider" />
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="empty-notifications">
                          <FiBell size={24} className="text-dim" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`notification-item ${n.read ? 'read' : 'unread'}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className="notification-icon-wrap">
                              <n.icon className={`notif-type-icon ${n.type}`} size={16} />
                            </div>
                            <div className="notification-content">
                              <p className="notification-text">{n.text}</p>
                              <span className="notification-time">{timeAgo(n.createdAt)}</span>
                            </div>
                            {!n.read && <div className="unread-dot" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="avatar-menu">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="avatar avatar-sm"
                  onClick={() => setDropOpen((p) => !p)}
                />
                {dropOpen && (
                  <div className="avatar-dropdown fade-in">
                    <div className="dropdown-user">
                      <img src={user?.avatar} alt="" className="avatar avatar-md" />
                      <div>
                        <div className="dropdown-name">{user?.fullName}</div>
                        <div className="dropdown-username text-dim">@{user?.username}</div>
                      </div>
                    </div>
                    <div className="divider" />
                    <Link to={`/channel/${user?.username}`} className="dropdown-item" onClick={() => setDropOpen(false)}>My Channel</Link>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropOpen(false)}>Dashboard</Link>
                    <Link to="/playlists" className="dropdown-item" onClick={() => setDropOpen(false)}>Playlists</Link>
                    <Link to="/tweets" className="dropdown-item" onClick={() => setDropOpen(false)}>Tweets</Link>
                    <Link to="/liked" className="dropdown-item" onClick={() => setDropOpen(false)}>Liked Videos</Link>
                    <Link to="/history" className="dropdown-item" onClick={() => setDropOpen(false)}>Watch History</Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => setDropOpen(false)}>Settings</Link>
                    <div className="divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join</Link>
            </>
          )}
        </div>
      </header>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  )
}
