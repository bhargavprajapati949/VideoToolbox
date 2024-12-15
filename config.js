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
  }
});

config.validate({ allowed: 'strict' });

export default config;