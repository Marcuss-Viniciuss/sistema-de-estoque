import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Product, Category } from '../types/inventory';

interface ProductCardProps {
  product: Product;
  category: Category | undefined;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, category, onEdit, onDelete }) => {
  const isLowStock = product.quantity <= product.minimumStock && product.quantity > 0;
  const isOutOfStock = product.quantity === 0;
  
  return (
    <div className="card overflow-hidden transition-all hover:shadow-md">
      <div className="h-48 bg-gray-200 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Sem imagem</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium text-lg line-clamp-1">{product.name}</h3>
          <div 
            className="h-4 w-4 rounded-full" 
            style={{ backgroundColor: category?.color || '#CBD5E1' }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            <div className="flex items-center mt-1">
              <span className="text-sm mr-1">Estoque:</span>
              <span 
                className={`text-sm font-medium ${
                  isOutOfStock 
                    ? 'text-red-500' 
                    : isLowStock 
                    ? 'text-amber-500' 
                    : 'text-green-600'
                }`}
              >
                {product.quantity}
              </span>
              {isLowStock && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                  Baixo
                </span>
              )}
              {isOutOfStock && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                  Esgotado
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button 
              onClick={() => onEdit(product)}
              className="p-1.5 text-gray-500 hover:text-[#004A8D] hover:bg-[#004A8D]/10 rounded-md transition-colors"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;