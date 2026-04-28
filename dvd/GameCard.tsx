
import React from 'react';
import { PlayIcon } from './icons/PlayIcon';

interface GameCardProps {
    id?: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    isEnabled: boolean;
    onPlay: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ id, title, description, icon, isEnabled, onPlay }) => {
    return (
        <div id={id} className={`bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-slate-700 hover:border-cyan-500 flex flex-col transition-all duration-300 hover:-translate-y-2 ${!isEnabled ? 'opacity-50' : ''}`}>
            <div className="relative h-40 flex items-center justify-center bg-slate-900/50 p-4 rounded-t-xl">
                {isEnabled && icon ? (
                    <div className="w-24 h-24 text-cyan-400 drop-shadow-lg">{icon}</div>
                ) : (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-xl">
                        <span className="text-white text-2xl font-bold tracking-widest -rotate-12">COMING SOON</span>
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-slate-300 text-sm mt-2 flex-grow">{description}</p>
                <button 
                    onClick={onPlay} 
                    disabled={!isEnabled}
                    className="mt-4 w-full flex items-center justify-center bg-cyan-500 text-white font-bold text-lg py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150 ease-in-out disabled:bg-slate-500 disabled:border-b-0 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                >
                    <PlayIcon className="w-6 h-6 mr-2" />
                    <span>Play</span>
                </button>
            </div>
        </div>
    );
};

export default GameCard;
