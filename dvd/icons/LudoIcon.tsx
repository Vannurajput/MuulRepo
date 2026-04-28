import React from 'react';

export const LudoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M40 0H60V40H100V60H60V100H40V60H0V40H40V0Z" fill="currentColor" opacity="0.2"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M0 0H40V40H0V0ZM15 15H25V25H15V15Z" fill="#F3645A"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M60 0H100V40H60V0ZM75 15H85V25H75V15Z" fill="#54CFF8"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M0 60H40V100H0V60ZM15 75H25V85H15V75Z" fill="#F9CB4A"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M60 60H100V100H60V60ZM75 75H85V85H75V75Z" fill="#82C341"/>
    <path d="M40 40H60V60H40V40Z" fill="currentColor" opacity="0.5"/>
  </svg>
);