import api from './api'

// ── AUTH / USER ───────────────────────────────────────────
export const authService = {
  register: (formData) => api.post('/users/register', formData),

  login: async (data) => {
    const res = await api.post('/users/login', data)
    const { accessToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    return res
  },

  logout: async () => {
    const res = await api.post('/users/logout')
    localStorage.removeItem('accessToken')
    return res
  },

  getCurrentUser: () => api.get('/users/current-user'),

  changePassword: (data) => api.post('/users/change-password', data),

  updateProfile: (data) => api.patch('/users/update-profile', data),

  updateAvatar: (formData) => api.patch('/users/update-avatar', formData),

  updateCoverImage: (formData) => api.patch('/users/update-cover', formData),

  getChannelProfile: (username) => api.get(`/users/channel/${username}`),

  getWatchHistory: () => api.get('/users/watch-history'),
}

// ── VIDEOS ────────────────────────────────────────────────
export const videoService = {
  getAllVideos: (params) => api.get('/videos', { params }),

  getVideoById: (id) => api.get(`/videos/${id}`),

  publishVideo: (formData, config) => api.post('/videos', formData, config),

  updateVideo: (id, formData) => api.patch(`/videos/${id}`, formData),

  deleteVideo: (id) => api.delete(`/videos/${id}`),

  togglePublish: (id) => api.patch(`/videos/toggle/publish/${id}`),
}

// ── COMMENTS ──────────────────────────────────────────────
export const commentService = {
  getVideoComments: (videoId, params) => api.get(`/comments/${videoId}`, { params }),

  addComment: (videoId, data) => api.post(`/comments/${videoId}`, data),

  updateComment: (commentId, data) => api.patch(`/comments/c/${commentId}`, data),

  deleteComment: (commentId) => api.delete(`/comments/c/${commentId}`),
}

// ── LIKES ─────────────────────────────────────────────────
export const likeService = {
  toggleVideoLike: (videoId) => api.post(`/likes/toggle/v/${videoId}`),

  toggleCommentLike: (commentId) => api.post(`/likes/toggle/c/${commentId}`),

  toggleTweetLike: (tweetId) => api.post(`/likes/toggle/t/${tweetId}`),

  getLikedVideos: () => api.get('/likes/videos'),
}

// ── SUBSCRIPTIONS ─────────────────────────────────────────
export const subscriptionService = {
  toggleSubscription: (channelId) => api.post(`/subscriptions/c/${channelId}`),

  getChannelSubscribers: (channelId) => api.get(`/subscriptions/u/${channelId}`),

  getSubscribedChannels: (subscriberId) => api.get(`/subscriptions/c/${subscriberId}`),
}

// ── PLAYLISTS ─────────────────────────────────────────────
export const playlistService = {
  createPlaylist: (data) => api.post('/playlists', data),

  getUserPlaylists: (userId) => api.get(`/playlists/user/${userId}`),

  getPlaylistById: (id) => api.get(`/playlists/${id}`),

  addVideoToPlaylist: (playlistId, videoId) => api.patch(`/playlists/add/${videoId}/${playlistId}`),

  removeVideoFromPlaylist: (playlistId, videoId) => api.patch(`/playlists/remove/${videoId}/${playlistId}`),

  deletePlaylist: (id) => api.delete(`/playlists/${id}`),

  updatePlaylist: (id, data) => api.patch(`/playlists/${id}`, data),
}

// ── TWEETS ────────────────────────────────────────────────
export const tweetService = {
  createTweet: (data) => api.post('/tweets', data),

  getUserTweets: (userId) => api.get(`/tweets/user/${userId}`),

  updateTweet: (id, data) => api.patch(`/tweets/${id}`, data),

  deleteTweet: (id) => api.delete(`/tweets/${id}`),
}

// ── DASHBOARD ─────────────────────────────────────────────
export const dashboardService = {
  getChannelStats: () => api.get('/dashboard/stats'),

  getChannelVideos: () => api.get('/dashboard/videos'),
}
