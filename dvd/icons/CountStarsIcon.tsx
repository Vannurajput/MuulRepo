import React from 'react';

const Star: React.FC<{x: number, y: number, size: number, opacity: number}> = ({x, y, size, opacity}) => (
    <path d={`M${x} ${y-size} L${x+size*0.29} ${y-size*0.4} L${x+size*0.95} ${y-size*0.31} L${x+size*0.48} ${y+size*0.15} L${x+size*0.59} ${y+size*0.81} L${x} ${y+size*0.5} L${x-size*0.59} ${y+size*0.81} L${x-size*0.48} ${y+size*0.15} L${x-size*0.95} ${y-size*0.31} L${x-size*0.29} ${y-size*0.4} Z`} fill="currentColor" opacity={opacity}/>
)

export const CountStarsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <Star x={50} y={30} size={20} opacity={1} />
    <Star x={80} y={55} size={15} opacity={0.8} />
    <Star x={25} y={65} size={18} opacity={0.9} />
    <Star x={40} y={80} size={10} opacity={0.7} />
  </svg>
);