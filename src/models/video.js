import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';
import User from './user.js';

const Video = sequelize.define('Video', {
  video_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id',
    }
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  tableName: 'Videos',
  timestamps: false
});

export default Video;