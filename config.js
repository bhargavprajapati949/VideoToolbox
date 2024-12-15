import convict from 'convict';

const config = convict({
  jwtSecret: {
    doc: 'Secret key for JWT token signing',
    format: String,
    default: 'defaultSecretKey',
    env: 'JWT_SECRET',
  },
  logLevel: {
    doc: 'Log level for the application',
    format: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    env: 'LOG_LEVEL'
  },
  port: {
    doc: 'The port the app runs on',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  video: {
    maxSize: {
      doc: 'Maximum video size in bytes',
      format: 'nat',
      default: 52428800, // 50 MB
      env: 'MAX_VIDEO_SIZE',
    },
    minDuration: {
      doc: 'Minimum video duration in seconds',
      format: 'nat',
      default: 5, // 1 second
      env: 'MIN_VIDEO_DURATION',
    },
    maxDuration: {
      doc: 'Maximum video duration in seconds',
      format: 'nat',
      default: 300, // 5 minutes
      env: 'MAX_VIDEO_DURATION',
    },
    allowedTypes: {
      doc: 'Allowed video file types',
      format: Array,
      default: [
        'video/mp4',
        'video/x-matroska', // .mkv
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
      ],
      env: 'ALLOWED_VIDEO_TYPES',
    },
    uploadDirectory: {
      doc: 'Directory for storing uploaded videos',
      format: String,
      default: 'uploads',
      env: 'UPLOAD_DIRECTORY',
    },
    maxLinkShareTime: {
      doc: 'Maximum time in seconds for which a link can be shared',
      format: 'nat',
      default: 86400, // 24 hours in seconds
      env: 'MAX_LINK_SHARE_TIME',
    },
  },
});

config.validate({ allowed: 'strict' });

export default config;