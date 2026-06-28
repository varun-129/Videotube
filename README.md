# 🎬 VideoTube

<div align="center">
  <img src="public/videotube_banner.png" alt="VideoTube Banner" width="800px" style="border-radius: 12px; box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4); margin-bottom: 20px;" />
  
  <p><strong>A production-ready, high-performance video sharing & microblogging platform built with the MERN stack.</strong></p>
  
  <p>
    <a href="#-system-architecture"><strong>Explore Architecture</strong></a> •
    <a href="#-api-documentation"><strong>API Reference</strong></a> •
    <a href="#-database-schema"><strong>Database Schema</strong></a> •
    <a href="#-installation-and-setup"><strong>Setup Guide</strong></a>
  </p>

  <div>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Badge" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Badge" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary Badge" />
    <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Badge" />
    <img src="https://img.shields.io/badge/Zustand-443322?style=for-the-badge&logo=react&logoColor=white" alt="Zustand Badge" />
    <img src="https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge" alt="License Badge" />
  </div>
</div>

---

## 📝 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Project Workflow (Request Lifecycle)](#-project-workflow-request-lifecycle)
5. [Folder Structure](#-folder-structure)
6. [Installation and Setup](#-installation-and-setup)
7. [Environment Variables](#-environment-variables)
8. [API Documentation](#-api-documentation)
9. [Authentication & Authorization Flow](#-authentication--authorization-flow)
10. [Database Schema](#-database-schema)
11. [File Upload Flow](#-file-upload-flow)
12. [Screenshots](#-screenshots)
13. [Deployment Guide](#-deployment-guide)
14. [Design Decisions & Best Practices](#-design-decisions--best-practices)
15. [Future Enhancements](#-future-enhancements)
16. [Contributing](#-contributing)
17. [License](#-license)
18. [Author](#-author)

---

## ✨ Features

### 💻 Backend Services
*   **Dual-Token Authentication:** Secure JWT-based access tokens (short-lived, cookie/headers) & refresh tokens (long-lived, database-stored).
*   **Media Pipeline:** Dynamic media processing for videos and images using Multer (local disk buffering) and Cloudinary (permanent cloud storage with secure HTTPS delivery).
*   **Advanced Query Aggregation:** Multi-stage Mongoose pipelines for paginated feeds, custom subscription metrics, like states, and user channels.
*   **Subscription Model:** Channel subscription tracking with mutual follower status metrics.
*   **Microblogging (Tweets):** Twitter-like micro-posts with user associations, likes, and chronological indexing.
*   **Social Interactions:** Likes/Unlikes on videos, comments, and tweets, along with threaded video comment sections.
*   **Playlists Management:** Playlist creation, updates, deletion, and video sorting features.
*   **Aesthetic Watch History:** Automatically records viewed videos uniquely per user with owner detail subpipelines.
*   **Dashboard Stats:** Consolidated views, subscribers, video counts, and likes metrics.

### 🎨 Frontend client
*   **Responsive Application Shell:** Sleek dashboard interface with modern dark/light styling and collapsible sidebar layout.
*   **Video Player Integration:** Custom media streaming playback using `react-player`.
*   **Client State Management:** Fast, lightweight state synchronization using `zustand`.
*   **Client-Side Routing:** Dynamic client-side views using `react-router-dom` v6 with route protection.
*   **Interactive Notifications:** Slick, unobtrusive error and success notifications using `react-hot-toast`.

---

## 🛠️ Tech Stack

| Layer | Technology | Usage / Purpose |
| :--- | :--- | :--- |
| **Backend Core** | Node.js (ES Modules) | Runtime Environment |
| **Web Server** | Express v5.x | REST API Web Application Framework |
| **Database** | MongoDB & Mongoose | Document Database & ODM Modeling |
| **File Storage** | Cloudinary | Cloud Image & Video Management |
| **File Middleware** | Multer | Multipart Form-Data Handler |
| **Authentication** | JWT & Bcrypt | Access/Refresh Token & Secure Password Hashing |
| **Frontend Core** | React v18 & Vite | UI Rendering and Fast Build Tooling |
| **State Store** | Zustand | Global Client Store & Hydration |
| **Client Routing** | React Router DOM v6 | Single Page App Route Controller |
| **HTTP Client** | Axios | Request Pipeline with Interceptors |

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client [Client - React Single Page Application]
        UI[React UI Components]
        Store[Zustand Auth/Media Store]
        AxiosClient[Axios HTTP Client]
    end

    subgraph Server [Backend Server - Express API Node App]
        App[app.js - Middlewares & Routes]
        AuthMW[auth.middleware.js - verifyJWT]
        MulterMW[multer.middleware.js - Local Temp Storage]
        
        subgraph Controllers [API Controllers]
            UserCtrl[user.controller.js]
            VidCtrl[video.controller.js]
            LikeCtrl[like.controller.js]
            SubCtrl[subscription.controller.js]
            PlayCtrl[playlist.controller.js]
            TweetCtrl[tweet.controller.js]
            DashCtrl[dashboard.controller.js]
        end
    end

    subgraph Cloud [External Cloud Services]
        Cloudinary[Cloudinary Cloud Media API]
        MongoDB[(MongoDB Atlas Database)]
    end

    UI --> Store
    Store --> AxiosClient
    AxiosClient -->|HTTPS Requests + HTTP-Only Cookies| App
    
    App --> AuthMW
    App --> MulterMW
    
    AuthMW --> Controllers
    MulterMW -->|Saves to ./public/temp| Controllers
    
    Controllers -->|Uploads Media / Deletes Temp| Cloudinary
    Controllers -->|Queries & Operations| MongoDB
```

---

## 🔄 Project Workflow (Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (React UI)
    participant Server as Express Server (app.js)
    participant Auth as Auth Middleware (verifyJWT)
    participant Multer as Multer Middleware
    participant Local as Local Temp Disk
    participant Controller as Controller Handler
    participant DB as MongoDB Atlas
    participant Cloudinary as Cloudinary API

    Client->>Server: HTTP POST /api/v1/videos (Auth token + Form data)
    Server->>Auth: Pass Request
    alt Token Missing or Invalid
        Auth-->>Client: 401 Unauthorized (ApiError Response)
    else Token Valid
        Auth->>Server: Populate req.user & Proceed
    end
    Server->>Multer: Process multipart files
    Multer->>Local: Save file locally (e.g., ./public/temp/video.mp4)
    Multer->>Server: Populate req.files
    Server->>Controller: Invoke publishAVideo()
    Controller->>Cloudinary: uploadToCloudinary(localPath)
    Note over Cloudinary: Process file & generate HTTPS link
    Cloudinary-->>Controller: Return upload response (secure_url, duration)
    Controller->>Local: Delete local temp file (fs.unlinkSync)
    Controller->>DB: Video.create(videoData, url, duration)
    DB-->>Controller: Database object saved
    Controller-->>Client: 201 Created (ApiResponse - JSON payload)
```

---

## 📂 Folder Structure

```text
.
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore files configuration
├── .prettierrc                  # Prettier code formatting rules
├── package.json                 # Backend Node dependencies & scripts
├── public/                      # Static assets folder
│   ├── temp/                    # Gitignored folder for Multer temp uploads
│   └── videotube_banner.png     # Project banner image
├── src/                         # Backend source directory
│   ├── app.js                   # Express application setup
│   ├── constants.js             # Globals / Constant variables
│   ├── index.js                 # Database connector & Server bootstrapper
│   ├── controllers/             # Request handler controllers
│   │   ├── comment.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   ├── user.controller.js
│   │   └── video.controller.js
│   ├── db/                      # Database connector configuration
│   │   └── index.js
│   ├── middlewares/             # Custom express middlewares
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   ├── models/                  # Mongoose MongoDB Data Schemas
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   ├── subscription.model.js
│   │   ├── tweet.model.js
│   │   ├── user.model.js
│   │   └── video.model.js
│   └── utils/                   # Shared utility classes and functions
│       ├── ApiError.js          # Standardized API Error class
│       ├── ApiResponse.js        # Standardized API Response wrapper
│       ├── asyncHandler.js       # Express Promise-rejection utility wrapper
│       ├── cloudinary.js        # Cloudinary upload service
│       └── cloudinaryDelete.js  # Cloudinary delete service
└── videotube-frontend/          # React frontend client root
    ├── index.html               # Vite Entry HTML template
    ├── package.json             # Frontend React dependencies & scripts
    ├── vite.config.js           # Vite server proxy and aliases configuration
    └── src/                     # Frontend source folder
        ├── App.jsx              # Client routing & layout wrapper
        ├── main.jsx             # React client DOM entry point
        ├── index.css            # Custom CSS Variable-based design system
        ├── components/          # Reusable react components
        ├── pages/               # Routed view pages (Watch, Channel, Dashboard)
        ├── services/            # Axios API endpoint calls
        └── store/               # Zustand global store files
```

---

## ⚙️ Installation and Setup

### Prerequisites
*   **Node.js** (v18+ recommended)
*   **MongoDB Atlas** or local database instance
*   **Cloudinary** account credentials

### 1. Repository Setup & Dependencies
Clone the repository and install dependencies for both components:

```bash
# Clone the repository
git clone https://github.com/your-username/videotube.git
cd videotube

# Install backend dependencies
npm install

# Install frontend dependencies
cd videotube-frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the **root** folder based on the `.env.example` file:

```bash
cd ..
cp .env.example .env
```
Fill in your database connection string, JWT secrets, and Cloudinary keys inside the newly created `.env` file.

### 3. Running the Project

#### Run Backend Server (Development Mode)
```bash
# From the root project directory
npm run dev
```
The server will connect to MongoDB and start on `http://localhost:8000`.

#### Run Frontend Client (Development Mode)
```bash
cd videotube-frontend
npm run dev
```
The client app will launch on `http://localhost:5173`. Vite is pre-configured with a backend API proxy mapping requests from the frontend port.

---

## 🔒 Environment Variables

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | Local express backend port. | `8000` |
| `CORS_ORIGIN` | Allowed domains accessing the endpoints. | `http://localhost:3000` |
| `MONGO_URL` | MongoDB connection URL including credentials. | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `ACCESS_TOKEN_SECRET` | Secret key for access token signing. | *Generate high-entropy hex string* |
| `ACCESS_TOKEN_EXPIRES_IN` | Life-span duration for access token. | `1d` |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh token signing. | *Generate high-entropy hex string* |
| `REFRESH_TOKEN_EXPIRES_IN` | Life-span duration for refresh token. | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Account name identifier. | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary Access API Key. | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary Access API Secret key. | `your_api_secret` |

---

## 📡 API Documentation

### User Routes (`/api/v1/users`)
| Method | Endpoint | Description | Auth Required | Payload / Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user account. Uploads avatar and cover images. | 🔓 Public | Multipart Form: `username`, `email`, `fullName`, `password`, `avatar` (file), `coverImage` (file) |
| `POST` | `/login` | Authenticate user & set httpOnly cookie tokens. | 🔓 Public | JSON: `{ email/username, password }` |
| `POST` | `/refresh-token` | Regenerates access & refresh token pair. | 🔓 Public | Cookie/Body: `{ refreshToken }` |
| `POST` | `/logout` | Invalidate DB refresh token & clear cookies. | 🔒 Protected | None (Read from active cookies) |
| `POST` | `/change-password` | Update account password. | 🔒 Protected | JSON: `{ currentPassword, newPassword }` |
| `GET` | `/current-user` | Retrieve active authenticated user payload. | 🔒 Protected | None |
| `PATCH`| `/update-profile` | Update account text details (name and email). | 🔒 Protected | JSON: `{ fullName, email }` |
| `PATCH`| `/update-avatar` | Upload and replace avatar image on Cloudinary. | 🔒 Protected | Multipart Form: `avatar` (file) |
| `PATCH`| `/update-cover` | Upload and replace cover image on Cloudinary. | 🔒 Protected | Multipart Form: `coverImage` (file) |
| `GET` | `/channel/:username`| Fetch aggregated details of subscriber counts and status. | 🔓 Optional | Route parameter: `:username` |
| `GET` | `/watch-history` | Fetch paginated watch history containing owner details. | 🔒 Protected | None |

### Video Routes (`/api/v1/videos`)
| Method | Endpoint | Description | Auth Required | Query / Route Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Fetch all public videos. Supports search, filtering, and pagination. | 🔓 Optional | Query: `?page=1&limit=10&query=searchStr&sortBy=createdAt&sortType=desc&userId=ID&tag=Gaming` |
| `POST` | `/` | Publish a video file with a thumbnail to Cloudinary. | 🔒 Protected | Multipart Form: `title`, `description`, `tag`, `videoFile` (file), `thumbnail` (file) |
| `GET` | `/:videoId` | Get details of a single video, increment views, append to watch history. | 🔓 Optional | Route parameter: `:videoId` |
| `PATCH`| `/:videoId` | Update video details or replace thumbnail. | 🔒 Protected | Route parameter: `:videoId`. Multipart: `title`, `description`, `tag`, `thumbnail` (file) |
| `DELETE`| `/:videoId` | Delete video files from Cloudinary and DB record. | 🔒 Protected | Route parameter: `:videoId` |
| `PATCH`| `/toggle/publish/:videoId` | Toggle video publish state (Public / Private). | 🔒 Protected | Route parameter: `:videoId` |

### Comment Routes (`/api/v1/comments`)
| Method | Endpoint | Description | Auth Required | Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/:videoId` | Fetch paginated comments for a video. | 🔓 Optional | Route: `:videoId`. Query: `?page=1&limit=10` |
| `POST` | `/:videoId` | Write a comment on a video. | 🔒 Protected | Route: `:videoId`. JSON: `{ content }` |
| `PATCH`| `/c/:commentId` | Edit a written comment. | 🔒 Protected | Route: `:commentId`. JSON: `{ content }` |
| `DELETE`| `/c/:commentId` | Delete comment and associated like records. | 🔒 Protected | Route: `:commentId` |

### Like Routes (`/api/v1/likes`)
| Method | Endpoint | Description | Auth Required | Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/toggle/v/:videoId`| Like or unlike a video. | 🔒 Protected | Route: `:videoId` |
| `POST` | `/toggle/c/:commentId`| Like or unlike a comment. | 🔒 Protected | Route: `:commentId` |
| `POST` | `/toggle/t/:tweetId`| Like or unlike a tweet. | 🔒 Protected | Route: `:tweetId` |
| `GET` | `/videos` | Fetch all videos liked by the user. | 🔒 Protected | None |

### Subscription Routes (`/api/v1/subscriptions`)
> [!WARNING]
> **API Implementation Notice (Route Parameter Mismatch)**:
> In the codebase, the routes map key parameters to reversed names in controller queries.
> *   `GET /c/:channelId` calls `getSubscribedChannels(req.params.channelId)`, which queries who user `:channelId` is subscribed to (i.e. `:channelId` is handled as a **subscriber ID**).
> *   `GET /u/:subscriberId` calls `getUserChannelSubscribers(req.params.subscriberId)`, which returns subscribers to channel `:subscriberId` (i.e. `:subscriberId` is handled as a **channel ID**).
> 
> Follow the exact mapping schema below to avoid integration issues.

| Method | Endpoint | Description | Auth Required | Parameters / Path Logic |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/c/:channelId` | Subscribe/Unsubscribe to a target channel. | 🔒 Protected | `:channelId` -> Target channel to toggle. |
| `GET` | `/c/:channelId` | Fetch all channels to which user `:channelId` has subscribed. | 🔒 Protected | `:channelId` -> Treated internally as **subscriber ID**. |
| `GET` | `/u/:subscriberId` | Fetch all subscribers belonging to channel `:subscriberId`. | 🔒 Protected | `:subscriberId` -> Treated internally as **channel ID**. |

### Playlist Routes (`/api/v1/playlists`)
| Method | Endpoint | Description | Auth Required | Params / Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a new custom playlist. | 🔒 Protected | JSON: `{ name, description }` |
| `GET` | `/:playlistId` | Fetch playlist details with aggregated video items. | 🔒 Protected | Route: `:playlistId` |
| `PATCH`| `/:playlistId` | Update playlist metadata (name or description). | 🔒 Protected | Route: `:playlistId`. JSON: `{ name, description }` |
| `DELETE`| `/:playlistId` | Delete playlist record. | 🔒 Protected | Route: `:playlistId` |
| `PATCH`| `/add/:videoId/:playlistId` | Add a video to a playlist. | 🔒 Protected | Route: `:videoId`, `:playlistId` |
| `PATCH`| `/remove/:videoId/:playlistId`| Remove a video from a playlist. | 🔒 Protected | Route: `:videoId`, `:playlistId` |
| `GET` | `/user/:userId` | Get all playlists belonging to user `:userId`. | 🔒 Protected | Route: `:userId` |

### Tweet Routes (`/api/v1/tweets`)
| Method | Endpoint | Description | Auth Required | Params / Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a new tweet. | 🔒 Protected | JSON: `{ content }` |
| `GET` | `/user/:userId` | Get all tweets created by a specific user. | 🔓 Optional | Route: `:userId` |
| `PATCH`| `/:tweetId` | Edit a tweet content. | 🔒 Protected | Route: `:tweetId`. JSON: `{ content }` |
| `DELETE`| `/:tweetId` | Delete a tweet and clean up its likes. | 🔒 Protected | Route: `:tweetId` |

### Dashboard Routes (`/api/v1/dashboard`)
| Method | Endpoint | Description | Auth Required | Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Fetch total subscribers, video counts, total views, and total likes. | 🔒 Protected | None (uses credentials) |
| `GET` | `/videos` | Fetch all videos uploaded by the channel owner (published & unpublished). | 🔒 Protected | None (uses credentials) |

---

## 🔑 Authentication & Authorization Flow

Authentication relies on a secure **Double-Token** paradigm utilizing **Access Tokens** and **Refresh Tokens**. 

*   **Access Token (Short-Lived):** Fast, signed string containing user ID, username, email, and full name. Transmitted via HTTP-only Cookie (`accessToken`) or `Authorization: Bearer` header.
*   **Refresh Token (Long-Lived):** Signed string containing only the User ID. Stored both in an HTTP-only Cookie (`refreshToken`) and persisted in the User's database document (`refreshToken`).

### Token Refresh Pipeline
When an access token expires:
1. The client intercepts the failure or calls `POST /api/v1/users/refresh-token` reactively.
2. The server compares the incoming refresh token against the stored token in the database.
3. If they match, a brand new Access and Refresh Token pair is generated. The database is updated, cookies are reset, and control is handed back to the client app to retry the initial failed request.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (Axios)
    participant Server as Express API Router
    participant DB as MongoDB Atlas

    Client->>Server: GET /api/v1/videos/stats (Expired Access Token Cookie)
    Server-->>Client: 401 Unauthorized (Access Token Expired)
    
    Note over Client: Axios Interceptor catches error
    Client->>Server: POST /api/v1/users/refresh-token (Refresh Token Cookie)
    Server->>DB: Find user by decoded token ID
    DB-->>Server: Return User Object (includes saved refreshToken)
    
    alt Token Mismatch or Missing
        Server-->>Client: 401 Session Expired (Redirect to Login)
    else Token Matches Stored DB Token
        Note over Server: Generate new Access & Refresh tokens
        Server->>DB: User.findByIdAndUpdate(userId, { refreshToken: newRefreshToken })
        DB-->>Server: Saved
        Server-->>Client: Set Cookie / Respond 200 (Success)
        Note over Client: Axios retries initial request with new token
        Client->>Server: GET /api/v1/videos/stats (New Access Token Cookie)
        Server-->>Client: 200 Success (Stats Payload)
    end
```

---

## 🗄️ Database Schema

Below is the entity-relationship layout showcasing how the Mongoose collections reference each other:

```mermaid
erDiagram
    User {
        ObjectId id PK
        string username "Unique Index"
        string email "Unique Index"
        string fullName
        string avatar "Cloudinary URL"
        string coverImage "Cloudinary URL"
        ObjectIdArray watchHistory "Ref: Video"
        string password "Bcrypt hashed"
        string refreshToken
        date createdAt
        date updatedAt
    }

    Video {
        ObjectId id PK
        string videFile "Cloudinary URL"
        string thumbnail "Cloudinary URL"
        string title
        string description
        number duration
        number views
        boolean isPublished
        ObjectId owner FK "Ref: User"
        string tag "Default: Gaming"
        date createdAt
        date updatedAt
    }

    Comment {
        ObjectId id PK
        string content
        ObjectId video FK "Ref: Video"
        ObjectId owner FK "Ref: User"
        date createdAt
        date updatedAt
    }

    Like {
        ObjectId id PK
        ObjectId video FK "Ref: Video"
        ObjectId comment FK "Ref: Comment"
        ObjectId tweet FK "Ref: Tweet"
        ObjectId likedBy FK "Ref: User"
        date createdAt
        date updatedAt
    }

    Subscription {
        ObjectId id PK
        ObjectId subscriber FK "Ref: User"
        ObjectId channel FK "Ref: User"
        date createdAt
        date updatedAt
    }

    Playlist {
        ObjectId id PK
        string name
        string description
        ObjectIdArray videos FK "Ref: Video"
        ObjectId owner FK "Ref: User"
        date createdAt
        date updatedAt
    }

    Tweet {
        ObjectId id PK
        string content
        ObjectId owner FK "Ref: User"
        date createdAt
        date updatedAt
    }

    User ||--o{ Video : "publishes"
    User ||--o{ Comment : "writes"
    User ||--o{ Like : "likes"
    User ||--o{ Subscription : "subscribes/hosts"
    User ||--o{ Playlist : "owns"
    User ||--o{ Tweet : "posts"
    
    Video ||--o{ Comment : "has"
    Video ||--o{ Like : "receives"
    Comment ||--o{ Like : "receives"
    Tweet ||--o{ Like : "receives"
    Playlist }o--o{ Video : "contains"
```

---

## 📤 File Upload Flow

All file uploads (`avatar`, `coverImage`, `videoFile`, and `thumbnail`) are processed through a structured pipeline to prevent server file bloating.

### Pipeline Steps:
1.  **Multipart Parser (Multer):** Captures incoming files and writes them locally into the `./public/temp` directory under their original file name.
2.  **Validation:** Controller assesses the existence of the file. If missing, throws an `ApiError`.
3.  **Cloud Sync (Cloudinary upload):** Invokes `uploadToCloudinary()`, streaming the local file up to Cloudinary server.
4.  **Local Cleanup (Important):** Using an `async/await` try-catch block, the local server execution *guarantees* file deletion from local disk (`fs.unlinkSync(localFilePath)`) immediately after upload completion or upload failure.
5.  **Database Storage:** Controller saves only the returned secure Cloudinary HTTPS URL string in MongoDB.
6.  **Stale File Cleanup:** When updates occur (e.g. updating an avatar or thumbnail), the server extracts the asset's Cloudinary Public ID from the URL and deletes the old file using the `deleteFromCloudinary` helper.

```text
[Client Payload] 
       │
       ▼
┌──────────────┐
│ Multer MW    │ ───► Writes file locally to:  ./public/temp/filename.ext
└──────────────┘
       │
       ▼
┌──────────────┐
│ Controller   │ ───► Triggers Cloudinary upload API
└──────────────┘
       │
       ├─► [SUCCESS / FAIL] ──► unlinkSync() deletes local temp file immediately.
       │
       ▼
┌──────────────┐
│ MongoDB Save │ ───► Stores secure URL string in database document.
└──────────────┘
```

---

## 📸 Screenshots

*Below are UI demonstrations showing page components:*

| Home Video Feed | Video Watching Player | Creator Dashboard |
| :---: | :---: | :---: |
| ![Home Grid Mockup](https://placehold.co/600x400/121214/ffffff?text=VideoTube+Home+Feed) | ![Watch Page Mockup](https://placehold.co/600x400/121214/ffffff?text=Watch+Page+Player) | ![Dashboard Mockup](https://placehold.co/600x400/121214/ffffff?text=Creator+Dashboard+Stats) |

---

## 🚀 Deployment Guide

### Backend Deployment (e.g., Render, Heroku)
1.  Set up a new Web Service on your deployment host pointing to your repository.
2.  Configure environment variables in the host service environment settings exactly matching `.env.example`.
3.  **Multer Directory Setup:** Render uses dynamic disk paths. The directory `./public/temp` is tracked by git (via an empty directory configuration), ensuring the path exists.
4.  Set the start command to: `node src/index.js` (Ensure your server runner executes the bootstrap script).

### Frontend Deployment (e.g., Vercel, Netlify)
1.  Configure the build settings for your frontend framework:
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
2.  Add a rewriting configuration (like `vercel.json`) to redirect client routes back to `index.html` for single-page routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🧠 Design Decisions & Best Practices

1.  **Mongoose Aggregation Pipelines over Populate:** 
    For analytical queries (such as fetching channel stats, subscriber states, or finding out if the current logged-in user liked a video), the codebase utilizes native MongoDB aggregation pipelines (`$match`, `$lookup`, `$addFields`, `$cond`, `$in`) instead of Mongoose `.populate()`. This dramatically improves query response speeds and offloads complex sorting and logic to the DB engine.
2.  **Dual-Token HTTP-Only Cookies:**
    To block Cross-Site Scripting (XSS) attacks, access and refresh tokens are served via `httpOnly` and `secure: true` cookies. This prevents JavaScript scripts in the browser from reading sensitive tokens.
3.  **Local Temp Cache Safeguard:**
    Using Multer directly to pipe to Cloudinary can lead to memory leakage. The codebase uses local disk storage configurations for Multer, writes the file to disk, and uses `fs.unlinkSync` inside a `finally` block to ensure no local server storage exhaustion occurs.
4.  **Express v5.x Integration:**
    Utilizing the modern Express v5 framework for improved router speed and asynchronous routing logic support out-of-the-box.
5.  **Centralized Error Handler Middleware:**
    Instead of scattering `try-catch` response formats across controllers, controllers either utilize the `asyncHandler` wrapper or let express forward errors to a standardized, centralized error-handling middleware in `app.js` which responds using the standard JSON format of `ApiError`.

---

## 🔮 Future Enhancements

*   **Real-time notifications:** WebSockets integration for instantaneous subscription and like alerts.
*   **Video Transcoding:** Automatic video compression and HLS adaptive bit-rate streaming configuration.
*   **Categories Management:** Dynamic server-driven video categories and advanced filtering feeds.
*   **Search Auto-complete:** Redis-backed indexing for quick search bars.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the ISC License. See [LICENSE](LICENSE) for more information.

---

## 👤 Author

**Varun Kumar**
*   GitHub: [@varunkumar](https://github.com/varun-129)
*   Keywords: JavaScript, Full Stack Developer, Backend Engineering
