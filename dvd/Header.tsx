
import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { UserIcon } from './icons/UserIcon';
import type { Profile } from '../types';

interface HeaderProps {
    onToggleSidebar: () => void;
    onToggleProfileModal: () => void;
    isVisible: boolean;
    activeProfile: Profile | null;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleProfileModal, isVisible, activeProfile }) => {
    if (!isVisible) return null;

    return (
        <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm shadow-md">
            <button id="tour-menu-button" onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                <MenuIcon className="w-8 h-8 text-cyan-400" />
                <span className="sr-only">Open Menu</span>
            </button>
            <h1 className="font-pixel text-lg sm:text-2xl text-cyan-400 truncate" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                {activeProfile ? `Welcome, ${activeProfile.name}!` : 'Game Zone'}
            </h1>
            <div className="flex items-center gap-2">
                <button id="tour-trophy-button" onClick={onToggleProfileModal} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                    <UserIcon className="w-8 h-8 text-cyan-400" />
                    <span className="sr-only">Show Profile</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
