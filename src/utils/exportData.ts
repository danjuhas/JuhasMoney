import type { Expense, Category } from '../types';

export async function exportToCSV(expenses: Expense[], categories: Category[], monthStr: string) {
  // 1. Prepare Data
  const getCategoryName = (id?: string) => {
    if (!id) return 'Sem Categoria';
    return categories.find(c => c.id === id)?.name || 'Desconhecido';
  };

  const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
  const rows = expenses.map(exp => {
    const date = new Date(exp.created_at).toLocaleDateString('pt-BR');
    const desc = exp.description.replace(/,/g, ''); // prevent csv break
    const cat = getCategoryName(exp.category_id);
    const type = exp.type === 'income' ? 'Receita' : 'Despesa';
    const amount = exp.amount.toString().replace('.', ',');
    return `${date},${desc},${cat},${type},${amount}`;
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // 2. Create Blob and Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `JuhasMoney_Relatorio_${monthStr}.csv`;

  triggerDownload(blob, filename);
}

export async function exportToImage(elementId: string, monthStr: string) {
  try {
    const { toBlob } = await import('html-to-image');
    
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const blob = await toBlob(element, {
      backgroundColor: '#0f172a',
      pixelRatio: 2,
    });

    if (!blob) throw new Error('Failed to create blob');

    const filename = `JuhasMoney_Relatorio_${monthStr}.png`;
    await tryShareOrDownload(blob, filename, 'image/png');
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
}

export async function exportToPDF(elementId: string, monthStr: string) {
  try {
    const [{ toPng }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf')
    ]);

    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const imgData = await toPng(element, {
      backgroundColor: '#0f172a',
      pixelRatio: 2,
    });
    
    const elementWidth = element.offsetWidth || 1;
    const elementHeight = element.offsetHeight || 1;
    
    // Use fixed A4 width (210mm) and calculate dynamic height based on element aspect ratio
    const pdfWidth = 210;
    const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const blob = pdf.output('blob');
    const filename = `JuhasMoney_Relatorio_${monthStr}.pdf`;

    await tryShareOrDownload(blob, filename, 'application/pdf');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

// Helper to use Web Share API if available (great for mobile), else fallback to download
async function tryShareOrDownload(blob: Blob, filename: string, mimeType: string) {
  const file = new File([blob], filename, { type: mimeType });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'JuhasMoney Relatório',
        text: 'Segue em anexo o relatório financeiro.',
      });
      return; // Shared successfully!
    } catch (error) {
      console.log('Share was canceled or failed, falling back to download', error);
      // Fall through to download
    }
  }

  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

