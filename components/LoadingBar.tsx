import React, { useState, useEffect, useRef } from 'react';

const LoadingBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setVisible(true);
      setProgress(1); // Start with a tiny bit so transition is visible
      
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 95) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 95;
          }
          // Slow down progress as it gets closer to 100
          let diff = (100 - p) / 10;
          return Math.min(p + Math.random() * diff, 95);
        });
      }, 800);

    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      
      if (visible) { // Only finish animation if it was already loading
        setProgress(100);
        
        // Hide after width animation finishes
        setTimeout(() => {
          setVisible(false);
          // Fully reset after fade out animation
          setTimeout(() => setProgress(0), 400);
        }, 400);
      }
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isLoading]);

  return (
    <>
      <div className={`loading-bar-container ${visible ? 'visible' : ''}`}>
        <div className="loading-bar-progress" style={{ width: `${progress}%` }}></div>
      </div>
      <style>{`
        .loading-bar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          z-index: 99999;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .loading-bar-container.visible {
          opacity: 1;
        }
        .loading-bar-progress {
          height: 100%;
          background-color: rgb(var(--color-primary));
          box-shadow: 0 0 10px rgb(var(--shadow-color)), 0 0 5px rgb(var(--shadow-color));
          transition: width 0.4s ease;
        }
      `}</style>
    </>
  );
};

export default LoadingBar;