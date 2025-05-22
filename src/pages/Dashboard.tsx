import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Layers, AlertTriangle } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import StatsCard from '../components/StatsCard';
import { Product, Transaction } from '../types/inventory';

const Dashboard: React.FC = () => {
  const { 
    products, 
    categories, 
    transactions, 
    getStockStatus, 
    getLowStockProducts 
  } = useInventory();
  
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stockStatus, setStockStatus] = useState(() => getStockStatus());

  // Filter products and transactions
  useEffect(() => {
    setLowStockProducts(getLowStockProducts());
    setRecentTransactions(
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    );
    setStockStatus(getStockStatus());
  }, [products, transactions, getLowStockProducts]);

  // Helper to get product name for transaction display
  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Produtos"
          value={products.length}
          icon={<Package size={24} />}
          color="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Itens em Baixo Estoque"
          value={stockStatus.lowStock}
          icon={<AlertTriangle size={24} />}
          color="warning"
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Categorias"
          value={categories.length}
          icon={<Layers size={24} />}
          color="secondary"
        />
        <StatsCard
          title="Movimentações"
          value={transactions.length}
          icon={<ShoppingCart size={24} />}
          color="success"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Recent Activity and Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Movimentações Recentes</h2>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center pb-3 border-b border-gray-100 last:border-0">
                  <div 
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      transaction.type === 'in' ? 'bg-green-100' : 'bg-blue-100'
                    }`}
                  >
                    <span className={`text-lg font-bold ${
                      transaction.type === 'in' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'in' ? '+' : '-'}
                      {transaction.quantity}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium">{transaction.products?.name || '-'}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.type === 'in' ? 'Entrada' : 'Saída'} • {formatDate(transaction.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação registrada.
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Produtos em Baixo Estoque</h2>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-xs">Sem img</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          Estoque: <span className={product.quantity === 0 ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                            {product.quantity}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          (Min: {product.minimumStock})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Todos os produtos estão com estoque adequado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;