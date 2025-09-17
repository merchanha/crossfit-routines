import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = true }: CardProps) {
  const baseClasses = 'bg-gray-800 border border-gray-700 rounded-lg shadow-lg';
  const interactiveClasses = onClick 
    ? 'cursor-pointer transform transition-all duration-200 hover:scale-105 active:scale-95' 
    : '';
  const hoverClasses = hover ? 'hover:border-gray-600 hover:shadow-xl' : '';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}