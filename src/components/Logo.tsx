import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  small?: boolean;
}

const Logo: React.FC<LogoProps> = ({ small = false }) => {
  return (
    <Link to="/" className="flex items-center">
      <BookOpen className="text-[#004A8D]" size={small ? 24 : 32} />
      <div className={`ml-2 flex flex-col ${small ? 'text-sm' : 'text-base'}`}>
        <span className="font-bold text-[#004A8D]">UNINASSAU</span>
        <span className="text-gray-600 text-xs">Sistema de Estoque</span>
      </div>
    </Link>
  );
};

export default Logo;