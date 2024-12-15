import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

const SharedLink = sequelize.define('SharedLink', {
  link_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  unique_link_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  video_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Videos',
      key: 'video_id',
    },
  },
  expiry_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'SharedLinks',
  timestamps: false
});

export default SharedLink;