import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../types/inventory';
import { useInventory } from '../contexts/InventoryContext';
import { supabase } from '../lib/supabase';

interface TransactionFormProps {
  onSubmit: (data: {
    productId: string;
    type: 'in' | 'out';
    quantity: number;
    notes?: string;
    createdBy: string;
  }) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel }) => {
  const { products } = useInventory();
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as 'in' | 'out',
    quantity: 1,
    notes: '',
    createdBy: '',
  });
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setFormData(prev => ({ ...prev, createdBy: session.user.id }));
      }
    };
    
    fetchUserId();
  }, []);
  
  const selectedProduct = products.find((p) => p.id === formData.productId);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 1,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Você precisa estar logado para criar uma movimentação');
      return;
    }

    onSubmit({
      ...formData,
      createdBy: session.user.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Registrar Movimentação
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="form-input bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Movimentação</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="in"
                      checked={formData.type === 'in'}
                      onChange={() => setFormData({ ...formData, type: 'in' })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Entrada</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="out"
                      checked={formData.type === 'out'}
                      onChange={() => setFormData({ ...formData, type: 'out' })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Saída</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max={formData.type === 'out' && selectedProduct ? selectedProduct.quantity : undefined}
                  className="form-input bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  required
                />
                {formData.type === 'out' && selectedProduct && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Disponível atualmente: {selectedProduct.quantity}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-input h-24 resize-none bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn ${formData.type === 'in' ? 'btn-success' : 'btn-primary'}`}
                disabled={
                  formData.type === 'out' && 
                  selectedProduct && 
                  formData.quantity > selectedProduct.quantity
                }
              >
                {formData.type === 'in' ? 'Registrar Entrada' : 'Registrar Saída'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;