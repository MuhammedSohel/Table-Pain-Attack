import React, { useState, useRef, useEffect } from 'react';
import { PenDefinition } from '../types';
import { sound } from '../utils/audio';

interface FloatingDeskPreviewProps {
  selectedPen: PenDefinition;
  onPenChange?: (id: string) => void;
}

export const FloatingDeskPreview: React.FC<FloatingDeskPreviewProps> = ({ selectedPen }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 4, y: -6 });
  const [penOffset, setPenOffset] = useState({ x: 0, y: 0, rot: -28 });
  const [isSpinning, setIsSpinning] = useState(false);

  // Subtle 3D perspective tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: -ny * 12 + 4,
      y: nx * 14 - 6
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 4, y: -6 });
  };

  // Fun interactive pen spin on click
  const handlePenFlick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    sound.playFlick(0.7);
    sound.playCollision(0.4);

    const startRot = penOffset.rot;
    const targetRot = startRot + 360 * 2;
    const startTime = performance.now();
    const duration = 900;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + (targetRot - startRot) * ease;
      const bounceY = Math.sin(progress * Math.PI) * -18;

      setPenOffset({ x: 0, y: bounceY, rot: currentRot });

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setPenOffset({ x: 0, y: 0, rot: targetRot % 360 });
        setIsSpinning(false);
        sound.playCollision(0.3);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-xl mx-auto flex items-center justify-center p-4 py-8 select-none"
      style={{ perspective: '1100px' }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-[#3568F5]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating Wooden Desk Gameboard */}
      <div
        className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-board-floating border border-slate-700/60 transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          background: 'linear-gradient(145deg, #5C3E28 0%, #4D331F 60%, #3B2414 100%)'
        }}
      >
        {/* Subtle wood planks */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_bottom,transparent_31px,rgba(0,0,0,0.5)_32px)] bg-[size:100%_32px]" />

        {/* Notebook Ruled Paper Sheet resting on the desk */}
        <div className="absolute left-8 top-10 w-64 h-80 rounded-xl bg-[#F5E8CC] shadow-lg -rotate-6 overflow-hidden pattern-ruled-paper border border-[#E0D2B4]/80 p-5">
          {/* Notebook Margin line in electric orange */}
          <div className="absolute top-0 bottom-0 left-8 w-[1.5px] bg-[#FF7138]/40" />

          {/* Doodles on notebook */}
          <div className="pl-6 pt-2 font-display text-slate-800 text-lg tracking-wider font-extrabold uppercase opacity-85">
            ROUND PROTOCOL
          </div>
          <div className="pl-6 pt-1 text-[11px] font-body text-slate-600 space-y-2">
            <p>1. Pull back to charge momentum.</p>
            <p>2. Aim for opponent pen centers.</p>
            <p>3. Edge knockouts score 350+ bonus pts.</p>
          </div>

          {/* Doodled pencil illustration */}
          <div className="absolute right-4 bottom-4 opacity-75">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#101522" strokeWidth="1.8">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        {/* Stationary Wooden Ruler Engraving */}
        <div className="absolute top-4 right-6 bottom-4 w-9 bg-[#3E2616] rounded-md border border-amber-900/40 flex flex-col justify-between py-4 items-end pr-1 text-[9px] font-arcade text-amber-200/50">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              {i % 2 === 0 && <span>{i * 2}</span>}
              <div className={`h-[1px] bg-amber-200/40 ${i % 2 === 0 ? 'w-3.5' : 'w-2'}`} />
            </div>
          ))}
        </div>

        {/* The Illustrated Ballpoint Pen Hero (Centerpiece) */}
        <div
          onClick={handlePenFlick}
          className="absolute inset-0 flex items-center justify-center cursor-pointer group"
          title="Click to flick the hero pen!"
        >
          <div
            className="relative transition-transform duration-75"
            style={{
              transform: `translate(${penOffset.x}px, ${penOffset.y}px) rotate(${penOffset.rot}deg)`
            }}
          >
            {/* Soft shadow cast by the pen */}
            <div className="absolute -bottom-3 left-6 right-6 h-4 bg-black/45 rounded-full blur-[6px] -rotate-1" />

            {/* Ballpoint Pen SVG vector model with detailed highlights */}
            <div className="relative w-80 h-16 flex items-center">
              {/* Back Plug */}
              <div
                className="w-8 h-10 rounded-l-md shadow-md border-y border-l border-white/20"
                style={{ backgroundColor: selectedPen.accentColor }}
              />

              {/* Pocket Clip */}
              <div
                className="absolute left-3 -top-3 w-24 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: selectedPen.clipColor }}
              />

              {/* Main Pen Barrel */}
              <div
                className="relative flex-1 h-9 flex items-center overflow-hidden border-y border-white/20"
                style={{
                  backgroundColor: selectedPen.primaryColor,
                  boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.35)'
                }}
              >
                {/* Branding text engraved on barrel */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-arcade text-[10px] tracking-widest uppercase font-bold text-slate-800/60">
                    TABLE ATTACK 0.7mm
                  </span>
                </div>
                {/* Specular cylindrical highlight line */}
                <div className="absolute top-1 left-0 right-0 h-1 bg-white/45" />
              </div>

              {/* Rubber Grip Section */}
              <div
                className="w-16 h-9.5 flex items-center justify-around px-1 shadow-inner border-y border-black/20"
                style={{ backgroundColor: selectedPen.accentColor }}
              >
                <div className="w-[1.5px] h-full bg-white/30" />
                <div className="w-[1.5px] h-full bg-white/30" />
                <div className="w-[1.5px] h-full bg-white/30" />
              </div>

              {/* Metallic Tip Cone */}
              <div
                className="w-12 h-9 flex items-center"
                style={{
                  clipPath: 'polygon(0 0, 100% 40%, 100% 60%, 0 100%)',
                  background: 'linear-gradient(to right, #CBD5E1, #94A3B8, #64748B)'
                }}
              />

              {/* Ballpoint tip dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm -ml-0.5"
                style={{ backgroundColor: selectedPen.inkColor }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Click Tip badge */}
        <div className="absolute bottom-4 left-6 pointer-events-none">
          <div className="px-3 py-1 bg-[#101522]/90 border border-[#FF7138]/60 text-[#FF7138] rounded-md text-[10px] font-arcade tracking-wider flex items-center gap-1.5 shadow-sm">
            <span>[CLICK PEN TO TEST FLICK]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
