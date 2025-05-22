import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Package } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import CategoryForm from '../components/CategoryForm';
import { Category } from '../types/inventory';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, getProductsByCategory } = useInventory();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const handleAddClick = () => {
    setEditingCategory(undefined);
    setShowForm(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSubmit = (categoryData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryData });
    } else {
      addCategory(categoryData);
    }
    setShowForm(false);
  };

  const handleDeleteClick = (id: string) => {
    // Check if category has products
    const productsInCategory = getProductsByCategory(id);
    
    if (productsInCategory.length > 0) {
      alert(`Esta categoria não pode ser excluída porque possui ${productsInCategory.length} produto(s) associado(s).`);
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategory(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Categorias</h1>
        <button
          onClick={handleAddClick}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Adicionar Categoria
        </button>
      </div>

      {/* Categories List */}
      <div className="grid gap-6">
        {categories.length > 0 ? (
          categories.map((category) => {
            const productsCount = getProductsByCategory(category.id).length;
            
            return (
              <div 
                key={category.id} 
                className="card p-6 transition-transform hover:translate-y-[-2px]"
              >
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center" 
                    style={{ backgroundColor: category.color }}
                  >
                    <div className="text-white">
                      <Package size={24} />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <p className="text-gray-500 text-sm">{category.description}</p>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end">
                    <div className="text-right mb-2">
                      <span className="text-sm text-gray-500">Produtos:</span>
                      <span className="ml-1 font-medium">{productsCount}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="p-1.5 text-gray-500 hover:text-[#004A8D] hover:bg-[#004A8D]/10 rounded-md transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        disabled={productsCount > 0}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-400">
              Adicione categorias para organizar seus produtos
            </p>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Categories;