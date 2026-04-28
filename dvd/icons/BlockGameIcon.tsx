
import React from 'react';

// A single block with a subtle 3D effect
const Block: React.FC<{ x: number; y: number; color: string; }> = ({ x, y, color }) => (
    <rect x={x} y={y} width="24" height="24" fill={color} rx="3" />
);

export const BlockGameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Grid background to match the prompt image */}
    <rect x="0" y="0" width="100" height="100" fill="#0f172a" />
    <path d="M25 0 V 100 M50 0 V 100 M75 0 V 100 M0 25 H 100 M0 50 H 100 M0 75 H 100" stroke="#1e293b" strokeWidth="2" />
    
    {/* Red L-Shape (inverted) */}
    <Block x={1} y={1} color="#ef4444" />
    <Block x={1} y={26} color="#ef4444" />
    <Block x={26} y={1} color="#ef4444" />
    
    {/* Yellow T-Shape */}
    <Block x={26} y={26} color="#facc15" />
    <Block x={51} y={26} color="#facc15" />
    <Block x={76} y={26} color="#facc15" />
    <Block x={51} y={51} color="#facc15" />

    {/* Green O-Shape (Square) */}
    <Block x={1} y={51} color="#34d399" />
    <Block x={26} y={51} color="#34d399" />
    <Block x={26} y={76} color="#34d399" />
    <Block x={1} y={76} color="#34d399" />
    
    {/* Blue I-Shape (shortened) */}
    <Block x={76} y={51} color="#60a5fa" />
    <Block x={76} y={76} color="#60a5fa" />
  </svg>
);
