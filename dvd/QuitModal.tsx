import React from 'react';

interface QuitModalProps {
    onClose: () => void;
    onExit: () => void;
}

const QuitModal: React.FC<QuitModalProps> = ({ onClose, onExit }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-cyan-400 w-full max-w-sm p-8 text-center" role="dialog" aria-modal="true" aria-labelledby="quit-modal-title">
                <h2 id="quit-modal-title" className="text-3xl font-bold text-white mb-4">Quit Game?</h2>
                <p className="text-slate-300 mb-8">Are you sure you want to exit? Your current game progress will be lost.</p>
                <div className="flex flex-col-reverse sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-500 text-white font-bold text-lg rounded-lg shadow-md border-b-4 border-slate-700 hover:bg-slate-400 active:border-b-0 active:translate-y-1 transition-all duration-150"
                    >
                        Continue Playing
                    </button>
                    <button
                        onClick={onExit}
                        className="w-full py-3 bg-red-600 text-white font-bold text-lg rounded-lg shadow-md border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all duration-150"
                    >
                        Exit Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuitModal;