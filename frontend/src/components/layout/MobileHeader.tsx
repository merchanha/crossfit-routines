import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

interface MobileHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function MobileHeader({ title, onMenuToggle }: MobileHeaderProps) {
  return (
    <div className="lg:hidden bg-gray-900 border-b border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          icon={Menu}
          className="p-2"
        />
      </div>
    </div>
  );
}