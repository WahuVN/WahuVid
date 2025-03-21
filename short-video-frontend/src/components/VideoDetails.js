import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const ShortVideoComponent = ({ video, onClose, initialTime, initialVolume }) => {
  console.log(video, onClose, initialTime, initialVolume)
  const [comments, setComments] = useState([
    { id: 1, user: 'User1', text: 'Great video!' },
    { id: 2, user: 'User2', text: 'Love the content!' },
  ]);
  const [newComment, setNewComment] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = initialTime;
      videoRef.current.volume = initialVolume;
    }
  }, [initialTime, initialVolume]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, { id: comments.length + 1, user: 'CurrentUser', text: newComment }]);
      setNewComment('');
    }
  };

  const handleClose = () => {
    onClose({id:video.id, currentTime: videoRef.current.currentTime, currentVolume: videoRef.current.volume});
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      position: 'relative'
    }}>
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <X size={24} />
      </button>
      <div style={{
        width: '66.666667%',
        height: '100%',
        backgroundColor: 'black',
        position: 'relative'
      }}>
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          controls
        >
          <source src={video.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div style={{
        width: '33.333333%',
        height: '100%',
        backgroundColor: 'white',
        padding: '1rem',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>Comments</h2>
          <div style={{ marginBottom: '1rem' }}>
            {comments.map((comment) => (
              <div key={comment.id} style={{
                backgroundColor: '#f3f4f6',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem'
              }}>
                <p style={{ fontWeight: 'bold' }}>{comment.user}</p>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShortVideoComponent;
