import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [randomGif, setRandomGif] = useState('');

  // Celebration GIFs (hardcoded as specified)
  const celebrationGifs = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/26u4cqi2I30juCOGY/giphy.gif',
    'https://media.giphy.com/media/l0HlvtIPzvv2h3mDu/giphy.gif',
    'https://media.giphy.com/media/3o7TKDEqX6bMpIhASQ/giphy.gif',
    'https://media.giphy.com/media/26tPbhZH3ZvmesIfW/giphy.gif'
  ];

  // Set random GIF on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * celebrationGifs.length);
    setRandomGif(celebrationGifs[randomIndex]);
  }, []);

  // Handle submit another request
  const handleSubmitAnother = () => {
    navigate('/');
  };

  return (
    <div className="thank-you-container">
      <div className="thank-you-content">
        <div className="success-icon">✅</div>
        <h2>Request Submitted Successfully!</h2>
        <p>
          Your delayed start discount request has been submitted for approval. 
          Please expect approval updates via email.
        </p>
        
        {randomGif && (
          <div className="gif-container">
            <img 
              src={randomGif} 
              alt="Celebration GIF" 
              className="celebration-gif"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleSubmitAnother}
          >
            Submit Another Request
          </button>
        </div>
        
        <div className="next-steps">
          <h3>What happens next?</h3>
          <ol>
            <li>Your request will be reviewed by your manager</li>
            <li>If approved, it will continue up the approval chain</li>
            <li>You'll receive email updates on the approval status</li>
            <li>Final approval will be made by Jason Amacker or Dean Hammond</li>
            <li>Taylor Garrity will be notified of the final decision</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
