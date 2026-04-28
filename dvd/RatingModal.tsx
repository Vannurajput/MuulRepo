import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { StarIcon } from './icons/StarIcon';

interface RatingModalProps {
    onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        console.log(`User submitted rating: ${rating}`);
        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-slate-800/90 rounded-2xl shadow-2xl shadow-cyan-500/20 border-2 border-cyan-400 w-full max-w-sm p-8 text-center">
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors">
                    <CloseIcon className="w-7 h-7 text-slate-400" />
                </button>
                
                {submitted ? (
                    <div>
                        <h2 className="text-3xl font-bold text-cyan-400">Thank You!</h2>
                        <p className="text-slate-300 mt-2">We appreciate your feedback!</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-2">Rate Our App</h2>
                        <p className="text-slate-300 mb-6">Let us know what you think!</p>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map(index => (
                                <StarIcon 
                                    key={index}
                                    className={`w-10 h-10 cursor-pointer transition-colors ${(hoverRating || rating) >= index ? 'text-cyan-400' : 'text-slate-600'}`}
                                    onClick={() => setRating(index)}
                                    onMouseEnter={() => setHoverRating(index)}
                                    onMouseLeave={() => setHoverRating(0)}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={rating === 0} 
                            className="w-full py-3 bg-cyan-500 text-white font-bold text-lg rounded-lg shadow-md border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150 disabled:bg-slate-500 disabled:border-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            Submit
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RatingModal;