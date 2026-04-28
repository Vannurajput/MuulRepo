import React from 'react';

const Dot: React.FC<{x: number, y: number, num: number}> = ({x, y, num}) => (
    <g>
        <circle cx={x} cy={y} r="8" fill="currentColor" opacity="0.8"/>
        <text x={x} y={y+2} textAnchor="middle" dy=".3em" fill="white" fontSize="10">{num}</text>
    </g>
)

export const ConnectDotsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20 80 L50 20 L80 80" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="8 4" opacity="0.5"/>
    <path d="M20 80 H80" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.8"/>
    <Dot x={20} y={80} num={1}/>
    <Dot x={80} y={80} num={2}/>
    <Dot x={50} y={20} num={3}/>
  </svg>
);