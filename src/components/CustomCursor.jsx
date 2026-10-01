import React, { useEffect, useState } from 'react';

export const CustomCursor = ({ enabled = true }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorText, setCursorText] = useState('');

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if target or parent is interactive
      const target = e.target;
      const interactiveEl = target.closest('a, button, input, textarea, select, [data-cursor]');

      if (interactiveEl) {
        setIsHovered(true);
        const label = interactiveEl.getAttribute('data-cursor');
        setCursorText(label || '');
      } else {
        setIsHovered(false);
        setCursorText('');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Dot */}
      <div
        className="custom-cursor-dot shadow-sm hidden md:block"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          backgroundColor: isHovered ? '#a5b4fc' : '#818cf8'
        }}
      />
      {/* Ring */}
      <div
        className={`custom-cursor-ring hidden md:flex items-center justify-center text-[10px] font-bold text-[#a8c4ef] tracking-wider uppercase ${isHovered ? 'custom-cursor-active' : ''}`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) scale(${isHovered ? 1.4 : 1})`,
        }}
      >
        {cursorText && <span className="animate-fade-in">{cursorText}</span>}
      </div>
    </>
  );
};
