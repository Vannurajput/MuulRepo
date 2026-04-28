import React from 'react';
import { SoundOnIcon } from './icons/SoundOnIcon';
import { SoundOffIcon } from './icons/SoundOffIcon';

interface SoundControlProps {
  isMuted: boolean;
  onToggle: () => void;
  className?: string;
}

const SoundControl: React.FC<SoundControlProps> = ({ isMuted, onToggle, className = '' }) => {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-center p-3 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <SoundOffIcon className="w-6 h-6" />
      ) : (
        <SoundOnIcon className="w-6 h-6" />
      )}
      <span className="ml-3 font-bold">{isMuted ? 'Sound Off' : 'Sound On'}</span>
    </button>
  );
};

export default SoundControl;