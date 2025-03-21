import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['NEW_FOLLOWER', 'VIDEO_LIKE', 'VIDEO_COMMENT', 'COMMENT_LIKE', 'FOLLOWED_USER_UPLOAD', 'COMMENT_REPLY'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
});

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
  return this;
};

NotificationSchema.virtual('url').get(function() {
  switch (this.type) {
    case 'NEW_FOLLOWER':
      return `/profile/${this.actor}`;
    case 'VIDEO_LIKE':
    case 'VIDEO_COMMENT':
    case 'COMMENT_REPLY':
    case 'FOLLOWED_USER_UPLOAD':
    case 'COMMENT_LIKE':
      return `${this.actor}/video/${this.video}`;
    default:
      return '/';
  }
});

export default mongoose.model('Notification', NotificationSchema);
