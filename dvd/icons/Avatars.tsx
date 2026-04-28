
import React from 'react';

export const CatAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" {...props}>
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#cffafe" />
        <path d="M20 70 C20 90, 80 90, 80 70 C80 50, 70 50, 70 40 C70 20, 55 15, 50 15 C45 15, 30 20, 30 40 C30 50, 20 50, 20 70 Z" fill="#6b7280" />
        <path d="M25 65 C25 80, 75 80, 75 65 C75 55, 65 55, 65 45 C65 30, 55 25, 50 25 C45 25, 35 30, 35 45 C35 55, 25 55, 25 65 Z" fill="#d1d5db" />
        <circle cx="40" cy="55" r="5" fill="black" />
        <circle cx="60" cy="55" r="5" fill="black" />
        <path d="M45 65 Q50 70 55 65" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M30 40 L20 20" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
        <path d="M70 40 L80 20" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
    </svg>
);

export const DogAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" {...props}>
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#fed7aa" />
        <path d="M25,80 C15,95 25,95 25,80 V 50 C25,30 35,20 50,20 C65,20 75,30 75,50 V 80 C75,95 85,95 75,80" fill="#a16207" />
        <path d="M30 75 V 50 C30,35 40,25 50,25 C60,25 70,35 70,50 V 75 C70,85 65,85 65,75 V 60 H 35 V 75 C35,85 30,85 30,75 Z" fill="#f97316" />
        <circle cx="43" cy="50" r="5" fill="black" />
        <circle cx="57" cy="50" r="5" fill="black" />
        <path d="M48 60 Q50 65 52 60" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
);

export const PandaAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" {...props}>
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#d1fae5" />
        <circle cx="50" cy="60" r="30" fill="white" />
        <path d="M30 45 a 15 15 0 0 1 15 15 a 10 10 0 0 0 -15 -15" fill="black" transform="rotate(-20, 30, 45)"/>
        <path d="M70 45 a 15 15 0 0 0 -15 15 a 10 10 0 0 1 15 -15" fill="black" transform="rotate(20, 70, 45)"/>
        <circle cx="50" cy="60" r="15" fill="#e5e7eb" />
        <circle cx="45" cy="55" r="5" fill="black" />
        <circle cx="55" cy="55" r="5" fill="black" />
        <path d="M48 65 Q50 68 52 65" stroke="black" strokeWidth="2" fill="none" />
    </svg>
);

export const FoxAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" {...props}>
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#ffedd5" />
        <path d="M50 15 L85 50 L80 90 L20 90 L15 50 Z" fill="#f97316" />
        <path d="M50 45 L70 60 L65 85 L35 85 L30 60 Z" fill="white" />
        <path d="M45 40 L50 15 L55 40 Z" fill="black"/>
        <path d="M35 40 L25 25" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
        <path d="M65 40 L75 25" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
        <circle cx="45" cy="55" r="4" fill="black" />
        <circle cx="55" cy="55" r="4" fill="black" />
        <path d="M48 65 L52 65" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);

export const AVATAR_MAP: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  cat: CatAvatar,
  dog: DogAvatar,
  panda: PandaAvatar,
  fox: FoxAvatar,
};

export const AVATAR_NAMES = Object.keys(AVATAR_MAP);