import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Expense, Category } from '../types';

export function useCSVImport(userId: string | null, onSuccess?: () => void, onError?: (msg: string) => void) {
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ expenses: number; incomes: number; newCategories: number } | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const processFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        // Count incomes, expenses, categories to create
        let expensesCount = 0;
        let incomesCount = 0;
        const uniqueCategories = new Set<string>();

        data.forEach(row => {
          const pagamento = parseFloat((row['Pagamento'] || '0').replace(',', '.'));
          const recebimento = parseFloat((row['Recebimento'] || '0').replace(',', '.'));
          if (pagamento > 0) expensesCount++;
          else if (recebimento > 0) incomesCount++;

          const categoryName = row['Categoria']?.trim();
          if (categoryName) {
            uniqueCategories.add(categoryName);
          }
        });

        setImportSummary({
          expenses: expensesCount,
          incomes: incomesCount,
          newCategories: uniqueCategories.size // Note: some might already exist, we will check in execute
        });
        setParsedData(data);
        setFileToImport(file);
      },
      error: (error) => {
        if (onError) onError('Erro ao ler arquivo CSV: ' + error.message);
      }
    });
  };

  const executeImport = async (existingCategories: Category[], upsertExpenses: (items: Expense[]) => Promise<void>) => {
    if (!userId || !parsedData.length) return;
    setIsImporting(true);

    try {
      // 1. Identify missing categories and their type
      const missingCategoriesMap = new Map<string, { name: string, type: 'income' | 'expense' }>();
      
      parsedData.forEach(row => {
        const catName = row['Categoria']?.trim();
        if (catName && !existingCategories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
          if (!missingCategoriesMap.has(catName.toLowerCase())) {
            const recebimento = parseFloat((row['Recebimento'] || '0').replace(',', '.'));
            missingCategoriesMap.set(catName.toLowerCase(), {
              name: catName,
              type: recebimento > 0 ? 'income' : 'expense'
            });
          }
        }
      });

      // 2. Create missing categories
      const newCategoriesToInsert: Category[] = Array.from(missingCategoriesMap.values()).map(cat => ({
        id: uuidv4(),
        user_id: userId,
        name: cat.name,
        type: cat.type,
        icon: cat.type === 'income' ? 'trending-up' : 'tag',
        color: cat.type === 'income' ? 'bg-emerald-500' : 'bg-slate-500'
      }));

      let allCategories = [...existingCategories];

      if (newCategoriesToInsert.length > 0) {
        const { error: catError } = await supabase.from('categories').insert(newCategoriesToInsert);
        if (catError) throw catError;
        allCategories = [...allCategories, ...newCategoriesToInsert];
      }

      // 3. Prepare expenses array
      const expensesToInsert: Expense[] = parsedData.map(row => {
        const dataParts = (row['Data'] || '').split('/');
        let isoDate = new Date().toISOString();
        let parsedDueDay: number | undefined;
        
        if (dataParts.length === 3) {
           // DD/MM/YYYY -> YYYY-MM-DD
           isoDate = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}T12:00:00Z`;
           parsedDueDay = parseInt(dataParts[0], 10);
        }

        const pagamento = parseFloat((row['Pagamento'] || '0').replace(',', '.'));
        const recebimento = parseFloat((row['Recebimento'] || '0').replace(',', '.'));
        
        const isIncome = recebimento > 0;
        const amount = isIncome ? recebimento : (pagamento > 0 ? pagamento : 0);
        
        const catName = row['Categoria']?.trim();
        const category = allCategories.find(c => c.name.toLowerCase() === catName?.toLowerCase());

        return {
          id: uuidv4(),
          user_id: userId,
          description: row['Beneficiário'] || row['Observações'] || 'Importação CSV',
          amount,
          created_at: isoDate,
          type: (isIncome ? 'income' : 'expense') as 'income' | 'expense',
          category_id: category?.id,
          is_paid: true,
          due_day: parsedDueDay
        };
      }).filter(e => e.amount > 0);

      // 4. Bulk upsert
      await upsertExpenses(expensesToInsert);
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error(err);
      if (onError) onError(err.message || 'Erro durante a importação.');
    } finally {
      setIsImporting(false);
      setFileToImport(null);
      setParsedData([]);
      setImportSummary(null);
    }
  };

  const cancelImport = () => {
    setFileToImport(null);
    setParsedData([]);
    setImportSummary(null);
  };

  return {
    processFile,
    executeImport,
    cancelImport,
    isImporting,
    importSummary,
    hasFile: !!fileToImport
  };
}
