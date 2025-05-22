import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { Product } from '../types/inventory';

const Products: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useInventory();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc'>('name-asc');

  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter((product) => product.categoryId === selectedCategory);
    }
    
    // Sort products
    switch (sortOrder) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'stock-asc':
        result.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'stock-desc':
        result.sort((a, b) => b.quantity - a.quantity);
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, sortOrder]);

  const handleAddClick = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSubmit = (productData: Omit<Product, 'id' | 'lastUpdated'>) => {
    if (editingProduct) {
      updateProduct({ ...editingProduct, ...productData });
    } else {
      addProduct(productData);
    }
    setShowForm(false);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto? Todas as transações associadas também serão excluídas.')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir o produto. Por favor, tente novamente.');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Produtos</h1>
        <button
          onClick={handleAddClick}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Adicionar Produto
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="form-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="form-input pl-9 pr-8 appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <select
              className="form-input pl-9 pr-8 appearance-none"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="stock-asc">Estoque (Menor-Maior)</option>
              <option value="stock-desc">Estoque (Maior-Menor)</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              category={categories.find((c) => c.id === product.categoryId)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-500 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-400">
            {searchQuery || selectedCategory
              ? 'Tente ajustar seus filtros de busca'
              : 'Adicione produtos para começar a gerenciar seu estoque'}
          </p>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Products;