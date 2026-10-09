import React from 'react';

/**
 * LiquidCanvas: Luminous ambient backdrop with drifting liquid orbs
 * that refract and glow dynamically beneath translucent liquid glass surfaces.
 */
export const LiquidCanvas: React.FC = () => {
  return (
    <div className="liquid-canvas" aria-hidden="true">
      {/* Drifting fluid liquid orbs */}
      <div className="liquid-orb liquid-orb-cyan" />
      <div className="liquid-orb liquid-orb-indigo" />
      <div className="liquid-orb liquid-orb-violet" />
      <div className="liquid-orb liquid-orb-amber" />
      
      {/* Chromatic caustic grain / sheen overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};
