import convict from 'convict';

const config = convict({
  port: {
    doc: 'The port the app runs on',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  logLevel: {
    doc: 'Log level for the application',
    format: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    env: 'LOG_LEVEL'
  },
});

config.validate({ allowed: 'strict' });

export default config;