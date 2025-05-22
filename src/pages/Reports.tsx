import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'stock' | 'transactions' | 'suppliers'>('stock');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      let data;
      switch (reportType) {
        case 'stock':
          const { data: products } = await supabase
            .from('products')
            .select(`
              *,
              categories (name),
              suppliers (
                name,
                cnpj,
                email,
                phone
              )
            `);
          data = products;
          break;
        case 'transactions':
          const { data: transactions } = await supabase
            .from('transactions')
            .select(`
              *,
              products (
                name,
                suppliers (
                  name,
                  cnpj
                )
              )
            `)
            .gte('date', dateRange.start)
            .lte('date', dateRange.end);
          data = transactions;
          break;
        case 'suppliers':
          const { data: suppliers } = await supabase
            .from('suppliers')
            .select('*');
          data = suppliers;
          break;
      }

      if (format === 'pdf') {
        generatePDF(data, reportType);
      } else {
        generateExcel(data, reportType);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (data: any[], type: string) => {
    const doc = new jsPDF();
    const title = `Relatório de ${
      type === 'stock' ? 'Estoque' :
      type === 'transactions' ? 'Movimentações' :
      'Fornecedores'
    }`;

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const columns = getColumns(type);
    const rows = data.map(item => getRow(item, type));

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 74, 141] },
    });

    doc.save(`relatorio_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateExcel = (data: any[], type: string) => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
      const row: any = {};
      const columns = getColumns(type);
      columns.forEach((col, index) => {
        row[col] = getRow(item, type)[index];
      });
      return row;
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getColumns = (type: string): string[] => {
    switch (type) {
      case 'stock':
        return ['Nome', 'SKU', 'Categoria', 'Quantidade', 'Estoque Mínimo', 'Fornecedor', 'CNPJ Fornecedor', 'Contato Fornecedor'];
      case 'transactions':
        return ['Data', 'Produto', 'Fornecedor', 'CNPJ Fornecedor', 'Tipo', 'Quantidade', 'Notas'];
      case 'suppliers':
        return ['Nome', 'CNPJ', 'Email', 'Telefone', 'Endereço'];
      default:
        return [];
    }
  };

  const getRow = (item: any, type: string): any[] => {
    switch (type) {
      case 'stock':
        return [
          item.name,
          item.sku,
          item.categories?.name || '-',
          item.quantity,
          item.minimum_stock,
          item.suppliers?.name || '-',
          item.suppliers?.cnpj || '-',
          item.suppliers ? `${item.suppliers.email || '-'} / ${item.suppliers.phone || '-'}` : '-',
        ];
      case 'transactions':
        return [
          new Date(item.date).toLocaleDateString('pt-BR'),
          item.products?.name || '-',
          item.products?.suppliers?.name || '-',
          item.products?.suppliers?.cnpj || '-',
          item.type === 'in' ? 'Entrada' : 'Saída',
          item.quantity,
          item.notes || '-',
        ];
      case 'suppliers':
        return [
          item.name,
          item.cnpj,
          item.email || '-',
          item.phone || '-',
          item.address || '-',
        ];
      default:
        return [];
    }
  };

  const renderButtonContent = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      );
    }
    
    return (
      <div className="flex items-center justify-center">
        <FileText className="w-4 h-4 mr-2" />
        <Download className="w-4 h-4 mr-2" />
        <span>Gerar Relatório</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Relatórios</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              className="form-input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="stock">Estoque</option>
              <option value="transactions">Movimentações</option>
              <option value="suppliers">Fornecedores</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato
            </label>
            <select
              className="form-input"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          {reportType === 'transactions' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={generateReport}
            disabled={loading || (reportType === 'transactions' && (!dateRange.start || !dateRange.end))}
            className="btn btn-primary w-full"
          >
            {renderButtonContent()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;