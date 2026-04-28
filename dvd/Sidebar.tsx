import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { StarIcon } from './icons/StarIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import SoundControl from './SoundControl';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onShowHome: () => void;
  onShowRating: () => void;
  onShowSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onShowHome, onShowRating, onShowSettings, isMuted, onToggleMute }) => {
  const handleNavigation = (navAction: () => void) => {
    navAction();
    onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-md shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-2xl font-bold text-cyan-400">Menu</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <CloseIcon className="w-7 h-7 text-cyan-400" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-3">
            <li>
              <button onClick={() => handleNavigation(onShowHome)} className="w-full flex items-center p-3 text-lg font-semibold text-slate-100 rounded-lg hover:bg-slate-700 transition-colors">
                <HomeIcon className="w-7 h-7 mr-4 text-cyan-400" />
                Home
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation(onShowRating)} className="w-full flex items-center p-3 text-lg font-semibold text-slate-100 rounded-lg hover:bg-slate-700 transition-colors">
                <StarIcon className="w-7 h-7 mr-4 text-cyan-400" />
                Rate App
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation(onShowSettings)} className="w-full flex items-center p-3 text-lg font-semibold text-slate-100 rounded-lg hover:bg-slate-700 transition-colors">
                <SettingsIcon className="w-7 h-7 mr-4 text-cyan-400" />
                Settings
              </button>
            </li>
            <li className="pt-3 border-t border-slate-700/50">
              <SoundControl isMuted={isMuted} onToggle={onToggleMute} />
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;