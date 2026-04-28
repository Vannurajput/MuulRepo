import React, { useState, useEffect, useRef } from 'react';
import type { TourStep } from '../types';

interface TourGuideProps {
  steps: TourStep[];
  stepIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ steps, stepIndex, onClose, onNext, onPrev }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[stepIndex];

  useEffect(() => {
    const findAndPosition = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        const updateRect = () => setTargetRect(element.getBoundingClientRect());
        
        // Use a timeout to wait for scroll to finish
        const scrollTimeout = setTimeout(updateRect, 300);
        
        // Also update immediately in case scrolling isn't needed
        updateRect();

        return () => clearTimeout(scrollTimeout);
      } else {
        setTargetRect(null); // Element not found
      }
    };

    const timeoutId = setTimeout(findAndPosition, 100); // Delay to allow DOM updates
    window.addEventListener('resize', findAndPosition);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', findAndPosition);
    };
  }, [stepIndex, currentStep.target]);

  const getPopoverPosition = (): React.CSSProperties => {
    if (!targetRect || !popoverRef.current) return { visibility: 'hidden' };

    const popoverHeight = popoverRef.current.offsetHeight;
    const popoverWidth = popoverRef.current.offsetWidth;
    const spacing = 12; // Space between target and popover

    const positions = {
      top: {
        top: targetRect.top - popoverHeight - spacing,
        left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
      },
      bottom: {
        top: targetRect.bottom + spacing,
        left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
      },
      left: {
        top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
        left: targetRect.left - popoverWidth - spacing,
      },
      right: {
        top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
        left: targetRect.right + spacing,
      },
    };
    
    let { top, left } = positions[currentStep.position || 'bottom'];

    // Adjust if off-screen
    if (top < 0) top = spacing;
    if (left < 0) left = spacing;
    if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - spacing;

    return { top, left };
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 animate-fade-in" onClick={onClose}></div>
      
      {/* Highlight Box */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-lg transition-all duration-300 ease-in-out"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            border: '2px solid #22d3ee',
          }}
        ></div>
      )}

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed bg-slate-800 text-slate-100 rounded-lg shadow-2xl w-80 p-5 z-10 transition-all duration-300 ease-in-out"
        style={getPopoverPosition()}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
      >
        <h3 id="tour-title" className="text-xl font-bold text-cyan-300 mb-2">{currentStep.title}</h3>
        <p id="tour-content" className="text-slate-300 mb-4">{currentStep.content}</p>
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-200">Skip Tour</button>
          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={stepIndex === 0} className="px-4 py-1.5 bg-slate-600 font-bold rounded-md disabled:opacity-50 hover:bg-slate-500">
              Back
            </button>
            <button onClick={onNext} className="px-4 py-1.5 bg-cyan-500 text-white font-bold rounded-md hover:bg-cyan-600">
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;