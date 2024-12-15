# Video Toolbox

**Video Toolbox** is a backend application for video storage, trimming, merging, and sharing. The system provides a robust API for managing video files, including uploading, modifying, and generating time-limited shared links for streaming or downloading videos.

---

## Features

- **Video Upload**: Upload videos with configurable size and duration limits.
- **Trimming**: Shorten videos from the start or end and save as new files.
- **Merging**: Merge multiple video clips into a single video.
- **Link Sharing**: Generate time-limited shareable links for streaming or downloading videos.

---

## Assumptions and Design Choices

1. **Authentication**:
   - APIs are secured using JWT-based authentication.
   - Video uploads and modifications are only allowed for authenticated users.

2. **Database**:
   - SQLite is used for simplicity but can be replaced with other SQL-based databases (e.g., PostgreSQL, MySQL) due to Sequelize's ORM.

3. **Video Processing**:
   - FFmpeg is used for all video processing tasks (trimming, merging, etc.).
   - Assumes FFmpeg is installed and available in the system PATH.

4. **Link Sharing**:
   - Maximum link expiry duration is configurable via environment variables.
   - Expired links are **not deleted from the database**. Manual cleanup or automation (e.g., cron jobs) should be implemented to manage expired links.

5. **Environment Variables**:
   - Default values for all configurations are set in the `config.js` file.
   - To override default values:
     - **Without Docker**: Export the required environment variables in the terminal.
     - **With Docker**: Use the `docker-compose.yml` file.

---

## Future Improvements

Below are some ideas to enhance the project for better scalability, performance, and functionality:

- **Cloud-Based Storage**: Use cloud storage solutions like AWS S3, Google Cloud Storage, or Azure Blob Storage to handle video uploads and reduce dependency on local storage.

- **Asynchronous Video Processing**: Offload video processing tasks such as merging and trimming to background workers by implementing a distributed task queue for better scalability and performance.

---

## Prerequisites

- **Node.js**: v16+ (Ensure you have the correct version installed.)
- **FFmpeg**: Must be installed and available in the system PATH.
  - [Installation Guide for FFmpeg](https://ffmpeg.org/download.html)
- **Docker**: Installed and running (for Docker-based setup).

---

## Installation

### Option 1: Run with Docker Compose

1. **Clone the Repository**:
   ```base
   git clone https://github.com/bhargavprajapati949/VideoToolbox.git
   cd video-toolbox
   ```

2. **Create the Uploads Directory on the Host**:
   ```base
   mkdir -p ./uploads
   ```

3. **Run the Docker Container**:
   Build and start the container in one step:
   ```base
   docker-compose up --build
   ```

4. **Access the API**:
   - The server will be running at `http://localhost:3000`.

### Option 2: Run Locally Without Docker

1. **Clone the Repository**:
   ```base
   git clone https://github.com/bhargavprajapati949/VideoToolbox.git
   cd video-toolbox
   ```

2. **Install Dependencies**:
   ```base
   npm install
   ```

3. **Export Environment Variables (Optional)**:
   If you want to override default values provided in the configuration file, export the required environment variables in your terminal:
   ```base
   export PORT=3000
   export JWT_SECRET=your_jwt_secret
   export UPLOAD_DIRECTORY=uploads
   export MAX_VIDEO_SIZE=50000000
   export MAX_VIDEO_DURATION=300
   export MIN_VIDEO_DURATION=5
   export ALLOWED_VIDEO_TYPES=video/mp4,video/x-matroska,video/quicktime
   export MAX_LINK_SHARE_TIME=86400
   ```

4. **Start the Server**:
   ```base
   npm start
   ```

5. **Run in Development Mode**:
   ```base
   npm run start:dev
   ```

---

## Running Tests

The project includes both **unit tests** and **end-to-end (E2E) tests** to ensure robustness. Follow the steps below to execute the test suites:

### Run Tests

To run all tests (unit and E2E):
```bash
npm run test
```

This will execute both unit tests and E2E tests.

### View Test Coverage

After running the test suite, you can view the code coverage report. The coverage report will be generated in the `./coverage` directory.

To check coverage details, open the following file in a browser:
```bash
./coverage/lcov-report/index.html
```

---

## References and Citations

The following resources and npm packages were referred to and used while developing this project:


- **FFmpeg**: [FFmpeg Official Documentation](https://ffmpeg.org/documentation.html)
- **fluent-ffmpeg**: [fluent-ffmpeg npm Documentation](https://www.npmjs.com/package/fluent-ffmpeg) - For working with FFmpeg in Node.js.
- **sequelize**: [sequelize npm Documentation](https://www.npmjs.com/package/sequelize) - For database models and queries.
- **jsonwebtoken**: [jsonwebtoken npm Documentation](https://www.npmjs.com/package/jsonwebtoken) - For generating and verifying JWT tokens.
- **bcrypt**: [bcrypt npm Documentation](https://www.npmjs.com/package/bcrypt) - For securely hashing user passwords.
- **multer**: [multer npm Documentation](https://www.npmjs.com/package/multer) - For handling file uploads.
- **convict**: [convict npm Documentation](https://www.npmjs.com/package/convict) - For managing configuration settings.
- **winston**: [winston npm Documentation](https://www.npmjs.com/package/winston) - For logging application events.


## API Documentation

Below is a comprehensive documentation of all the APIs supported by the project. 


### Postman Collection

You can find the Postman collection for all APIs [here](./Video%20Toolkit.postman_collection.json). Import it into Postman for easy testing of the endpoints.

### Base URL

- **Local Environment:** `http://localhost:<PORT>` (Default `PORT` is `3000`)

---

### 1. **Health Check**

#### Endpoint: `GET /_health`

**Description:**  
Check if the server and database are operational.

**Response:**
- **200 OK**: `"Video Toolbox is running!"`
- **500 Internal Server Error**: `"Video Toolbox is down!"`

---

### 2. **User APIs**

#### 2.1 **Register a User**

**Endpoint:** `POST /api/v1.0/user/register`  
**Description:** Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- **201 Created:**
```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```
- **400 Bad Request:** `"Email is already registered."`

---

#### 2.2 **Login a User**

**Endpoint:** `POST /api/v1.0/user/login`  
**Description:** Login a user and receive a JWT token for authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- **200 OK:**
```json
{
  "token": "JWT_TOKEN_HERE"
}
```
- **401 Unauthorized:** `"Invalid email or password."`

---

### 3. **Video APIs**

#### 3.1 **Upload a Video**

**Endpoint:** `POST /api/v1.0/video/upload`  
**Description:** Upload a video file. The file size, duration, and type are validated against the configured limits.

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Form Data:**
- `video`: The video file to upload.

**Response:**
- **201 Created:**
```json
{
  "message": "Video uploaded successfully.",
  "video": {
    "id": 1,
    "size": 5242880,
    "duration": 60
  }
}
```
- **400 Bad Request:** Validation errors (e.g., file size, type, duration).
- **401 Unauthorized:** `"Authorization header with Bearer token is missing"`

---

#### 3.2 **Trim a Video**

**Endpoint:** `POST /api/v1.0/video/trim`  
**Description:** Trim a video to a specified start and end time and save it as a new video.

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "video_id": 1,
  "start_time": 10,
  "end_time": 50
}
```

**Response:**
- **201 Created:**
```json
{
  "message": "Video trimmed successfully.",
  "video": {
    "id": 2,
    "size": 5242880,
    "duration": 40
  }
}
```
- **400 Bad Request:** `"Invalid start_time or end_time for trimming."`
- **404 Not Found:** `"Video with the given ID does not exist."`

---

#### 3.3 **Merge Videos**

**Endpoint:** `POST /api/v1.0/video/merge`  
**Description:** Merge multiple videos into a single file.

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "video_ids": [1, 2, 3]
}
```

**Response:**
- **201 Created:**
```json
{
  "message": "Video merged successfully.",
  "video": {
    "id": 4,
    "size": 10485760,
    "duration": 180
  }
}
```
- **400 Bad Request:** `"video_ids must be a non-empty array."`
- **404 Not Found:** `"Some video_ids are invalid or do not exist."`

---

#### 3.4 **Create a Shared Link**

**Endpoint:** `POST /api/v1.0/video/share`  
**Description:** Create a link to share a video for a specified time duration.

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "video_id": 1,
  "expiry_duration": 3600
}
```

**Response:**
- **201 Created:**
```json
{
  "message": "Shared link created successfully.",
  "link": "http://localhost:3000/api/v1.0/video/shared/<UNIQUE_LINK_ID>",
  "expiry_time": "2024-12-16T12:00:00Z"
}
```
- **400 Bad Request:** `"Expiry time cannot exceed the maximum allowed duration."`
- **404 Not Found:** `"Video with the given ID does not exist."`

---

#### 3.5 **Access a Shared Link**

**Endpoint:** `GET /api/v1.0/video/shared/:unique_link_id`  
**Description:** Access or download a shared video using a unique link.

**Query Parameters:**
- `action=download` (optional) to download the video. Default is streaming.

**Response:**
- **200 OK:** Streams or downloads the video.
- **403 Forbidden:** `"This link has expired."`
- **404 Not Found:** `"Invalid or expired link."`

---

### Error Handling

All API errors are returned in the following format:
```json
{
  "error": "Error message here."
}
```