import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [celebrationGif, setCelebrationGif] = useState('');

  useEffect(() => {
    // Celebration GIFs for success - defined inside useEffect to prevent dependency changes
    const celebrationGifs = [
      'https://media.giphy.com/media/26u4cqi2I30juCOGY/giphy.gif',
      'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
      'https://media.giphy.com/media/3o7TKDEqP6VJHaZSEA/giphy.gif',
      'https://media.giphy.com/media/3o7TKDEqP6VJHaZSEA/giphy.gif',
      'https://media.giphy.com/media/3o7TKDEqP6VJHaZSEA/giphy.gif'
    ];
    
    // Select a random celebration GIF
    const randomIndex = Math.floor(Math.random() * celebrationGifs.length);
    setCelebrationGif(celebrationGifs[randomIndex]);
  }, []); // Empty dependency array since celebrationGifs is now defined inside

  const handleSubmitAnother = () => {
    navigate('/');
  };

  return (
    <div className="thank-you-container">
      <div className="thank-you-content">
        <div className="success-icon">🎉</div>
        
        <h2>Request Submitted Successfully!</h2>
        
        <p>
          Your delayed start discount request has been submitted and is now in the approval workflow. 
          You will receive updates via Slack as it progresses through the approval chain.
        </p>

        {celebrationGif && (
          <div className="gif-container">
            <img 
              src={celebrationGif} 
              alt="Celebration" 
              className="celebration-gif"
            />
          </div>
        )}

        <div className="action-buttons">
          <button 
            onClick={handleSubmitAnother} 
            className="btn btn-primary"
          >
            Submit Another Request
          </button>
        </div>

        <div className="next-steps">
          <h3>What Happens Next?</h3>
          <ol>
            <li><strong>Immediate:</strong> Your request has been logged and sent to your manager for approval</li>
            <li><strong>Approval Chain:</strong> The request will work its way up the management chain</li>
            <li><strong>Final Approval:</strong> Once approved by Jason Amacker or Dean Hammond, the request will be processed</li>
            <li><strong>Notification:</strong> You'll receive a final confirmation via Slack</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
