import convict from 'convict';

const config = convict({
  port: {
    doc: 'The port the app runs on',
    format: 'port',
    default: 3000,
    env: 'PORT'
  }
});

config.validate({ allowed: 'strict' });

export default config;