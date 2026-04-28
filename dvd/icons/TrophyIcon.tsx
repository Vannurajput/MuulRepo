import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21A3.48 3.48 0 0 1 9 19.5c0 .83.67 1.5 1.5 1.5h3c.83 0 1.5-.67 1.5-1.5a3.48 3.48 0 0 1-1.03-2.29c-.5.23-.97-.24-.97-1.21v-2.34"></path>
    <path d="M12 14.5L9 9h6l-3 5.5z"></path>
  </svg>
);
