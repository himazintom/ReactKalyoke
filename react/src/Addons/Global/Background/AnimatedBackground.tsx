import React from 'react';
import './AnimatedBackground.scss';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="animated-background">
      <div className="spiral-container">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`spiral spiral-${i + 1}`} />
        ))}
      </div>
    </div>
  );
}; 