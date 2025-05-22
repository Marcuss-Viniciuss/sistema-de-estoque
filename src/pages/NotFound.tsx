import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <h1 className="text-6xl font-bold text-[#004A8D]">404</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-6">Página não encontrada</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        A página que você está procurando não existe ou foi movida para outro endereço.
      </p>
      <Link to="/" className="btn btn-primary flex items-center">
        <Home size={16} className="mr-2" />
        Voltar para o Dashboard
      </Link>
    </div>
  );
};

export default NotFound;