import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, Transaction, StockStatus } from '../types/inventory';

interface InventoryContextType {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<{ transactionsCount: number }>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  getStockStatus: () => StockStatus;
  searchProducts: (query: string) => Product[];
  getProductsByCategory: (categoryId: string) => Product[];
  getLowStockProducts: () => Product[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadData();
      })
      .subscribe();

    const transactionsSubscription = supabase
      .channel('transactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(transactionsSubscription);
    };
  }, []);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      if (categoriesData) setCategories(categoriesData);

      // Load products with supplier information
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            cnpj
          )
        `)
        .order('name');
      
      if (productsError) throw productsError;
      if (productsData) setProducts(productsData);

      // Load transactions with product information
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            suppliers (
              id,
              name,
              cnpj
            )
          )
        `)
        .order('date', { ascending: false });
      
      if (transactionsError) throw transactionsError;
      if (transactionsData) setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    try {
      // Convert camelCase to snake_case for database columns
      const dbProduct = {
        name: product.name,
        description: product.description,
        sku: product.sku,
        category_id: product.categoryId,
        quantity: product.quantity,
        minimum_stock: product.minimumStock,
        location: product.location,
        acquisition_date: product.acquisitionDate,
        image_url: product.imageUrl,
        supplier_id: product.supplierId
      };

      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) throw error;
      if (data) setProducts([...products, data]);
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      // Convert camelCase to snake_case for database columns
      const dbProduct = {
        name: updatedProduct.name,
        description: updatedProduct.description,
        sku: updatedProduct.sku,
        category_id: updatedProduct.categoryId,
        quantity: updatedProduct.quantity,
        minimum_stock: updatedProduct.minimumStock,
        location: updatedProduct.location,
        acquisition_date: updatedProduct.acquisitionDate,
        image_url: updatedProduct.imageUrl,
        supplier_id: updatedProduct.supplierId,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', updatedProduct.id);

      if (error) throw error;
      
      setProducts(
        products.map((product) =>
          product.id === updatedProduct.id
            ? { ...updatedProduct, lastUpdated: new Date().toISOString() }
            : product
        )
      );
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<{ transactionsCount: number }> => {
    try {
      // First, get the count of related transactions
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

      if (countError) throw countError;

      const transactionsCount = count || 0;

      // Delete related transactions first
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('product_id', id);

      if (transactionsError) throw transactionsError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) throw productError;
      
      // Update local state
      setTransactions(transactions.filter(t => t.productId !== id));
      setProducts(products.filter(p => p.id !== id));

      return { transactionsCount };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category }])
        .select()
        .single();

      if (error) throw error;
      if (data) setCategories([...categories, data]);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (updatedCategory: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(updatedCategory)
        .eq('id', updatedCategory.id);

      if (error) throw error;
      
      setCategories(
        categories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        )
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(categories.filter((category) => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        throw new Error('User must be authenticated to create a transaction');
      }

      // Convert camelCase to snake_case for database columns
      const dbTransaction = {
        product_id: transaction.productId,
        type: transaction.type,
        quantity: transaction.quantity,
        notes: transaction.notes,
        created_by: transaction.createdBy
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbTransaction])
        .select(`
          *,
          products (
            id,
            name,
            sku,
            suppliers (
              id,
              name,
              cnpj
            )
          )
        `)
        .single();

      if (error) throw error;
      if (data) {
        setTransactions([data, ...transactions]);
        loadData(); // Reload data to get updated product quantities
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const getStockStatus = (): StockStatus => {
    const total = products.length;
    const outOfStock = products.filter((product) => product.quantity === 0).length;
    const lowStock = products.filter(
      (product) => product.quantity > 0 && product.quantity <= product.minimumStock
    ).length;
    const available = total - outOfStock - lowStock;

    return {
      total,
      available,
      lowStock,
      outOfStock,
    };
  };

  const searchProducts = (query: string): Product[] => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm)
    );
  };

  const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter((product) => product.categoryId === categoryId);
  };

  const getLowStockProducts = (): Product[] => {
    return products.filter(
      (product) => product.quantity <= product.minimumStock
    );
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        transactions,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addTransaction,
        getStockStatus,
        searchProducts,
        getProductsByCategory,
        getLowStockProducts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};