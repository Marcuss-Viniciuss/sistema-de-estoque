import React, { useState } from 'react';
import { PlusCircle, ArrowDownLeft, ArrowUpRight, Calendar, Search } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import TransactionForm from '../components/TransactionForm';

const Transactions: React.FC = () => {
  const { transactions, products, addTransaction } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'in' | 'out'>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by transaction type
    if (transactionType !== 'all' && transaction.type !== transactionType) {
      return false;
    }
    
    // Filter by date range
    if (startDate && new Date(transaction.date) < new Date(startDate)) {
      return false;
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      if (new Date(transaction.date) > endDateTime) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const product = products.find((p) => p.id === transaction.productId);
      const query = searchQuery.toLowerCase();
      
      if (!product || 
          (!product.name.toLowerCase().includes(query) && 
           !product.sku.toLowerCase().includes(query) &&
           !(transaction.notes && transaction.notes.toLowerCase().includes(query)))) {
        return false;
      }
    }
    
    return true;
  });

  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleFormSubmit = (transactionData: any) => {
    addTransaction(transactionData);
    setShowForm(false);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get product name for transaction display
  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || '-';
  };

  // Get product SKU for transaction display
  const getProductSku = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.sku || '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Movimentações</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Nova Movimentação
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produto..."
              className="form-input pl-10 bg-white dark:bg-gray-700 dark:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Data inicial"
              className="form-input pl-10 bg-white dark:bg-gray-700 dark:text-gray-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Data final"
              className="form-input pl-10 bg-white dark:bg-gray-700 dark:text-gray-200"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <select
            className="form-input bg-white dark:bg-gray-700 dark:text-gray-200"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as 'all' | 'in' | 'out')}
          >
            <option value="all">Todos os tipos</option>
            <option value="in">Entradas</option>
            <option value="out">Saídas</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {sortedTransactions.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registrado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-200">
                        {transaction.products?.name || '-'}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">{transaction.products?.sku || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'in'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {transaction.type === 'in' ? (
                          <ArrowDownLeft size={14} className="mr-1" />
                        ) : (
                          <ArrowUpRight size={14} className="mr-1" />
                        )}
                        {transaction.type === 'in' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.createdBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Nenhuma movimentação encontrada</h3>
          <p className="text-gray-400 dark:text-gray-500">
            {searchQuery || startDate || endDate || transactionType !== 'all'
              ? 'Tente ajustar seus filtros de busca'
              : 'Adicione movimentações para começar a registrar o fluxo de estoque'}
          </p>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Transactions;