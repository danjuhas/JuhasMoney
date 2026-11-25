import type { Category, Expense } from '../types';

export interface LocalCategoryMatch {
  categoryId: string;
  confidence: 'high' | 'medium';
  source: 'history' | 'keyword';
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const KEYWORD_GROUPS: { categoryHints: string[]; keywords: string[] }[] = [
  {
    categoryHints: ['alimenta', 'comida', 'food', 'mercado', 'supermercado', 'grocer', 'restaurante'],
    keywords: [
      'ifood', 'rappi', 'uber eats', 'mercado', 'supermercado', 'padaria', 'acougue',
      'restaurante', 'lanchonete', 'pizzaria', 'hamburguer', 'mcdonalds', 'burger king',
      'starbucks', 'cafe', 'almoco', 'jantar', 'hortifruti', 'carrefour', 'atacadao',
      'assai', 'pao de acucar', 'bakery', 'grocery', 'supermarket', 'coffee', 'lunch', 'dinner',
    ],
  },
  {
    categoryHints: ['transport', 'mobilidade', 'carro', 'veiculo', 'combustivel', 'transit'],
    keywords: [
      'uber', '99', '99pop', 'cabify', 'taxi', 'gasolina', 'etanol', 'combustivel',
      'posto', 'shell', 'ipiranga', 'estacionamento', 'pedagio', 'sem parar', 'metro',
      'onibus', 'bilhete', 'passagem', 'oficina', 'mecanico', 'ipva', 'seguro auto',
      'fuel', 'gas', 'parking', 'subway', 'bus', 'toll',
    ],
  },
  {
    categoryHints: ['moradia', 'casa', 'habitacao', 'home', 'housing', 'contas', 'utilidades', 'utilities'],
    keywords: [
      'aluguel', 'condominio', 'iptu', 'energia', 'luz', 'enel', 'cpfl', 'agua',
      'sabesp', 'sanepar', 'internet', 'vivo', 'claro', 'tim', 'oi', 'fibra', 'gas',
      'rent', 'electricity', 'water', 'mortgage', 'wifi', 'hoa',
    ],
  },
  {
    categoryHints: ['saude', 'health', 'farmacia', 'medico', 'bem estar', 'wellness'],
    keywords: [
      'farmacia', 'drogaria', 'drogasil', 'raia', 'pague menos', 'remedio', 'medicamento',
      'medico', 'consulta', 'exame', 'dentista', 'psicologo', 'terapia', 'plano de saude',
      'unimed', 'amil', 'sulamerica', 'academia', 'smartfit', 'gympass', 'wellhub',
      'pharmacy', 'doctor', 'dentist', 'hospital', 'gym', 'therapy',
    ],
  },
  {
    categoryHints: ['lazer', 'entretenimento', 'entertainment', 'assinatura', 'subscription', 'stream'],
    keywords: [
      'netflix', 'spotify', 'disney', 'hbo', 'max', 'prime video', 'amazon prime',
      'youtube', 'apple tv', 'globoplay', 'cinema', 'ingresso', 'show', 'teatro',
      'steam', 'playstation', 'xbox', 'nintendo', 'bar', 'viagem', 'hotel', 'airbnb',
      'movie', 'concert', 'game', 'travel',
    ],
  },
  {
    categoryHints: ['educacao', 'education', 'estudo', 'curso', 'livros'],
    keywords: [
      'faculdade', 'escola', 'mensalidade', 'curso', 'udemy', 'alura', 'coursera',
      'livro', 'livraria', 'amazon livros', 'ingles', 'pos graduacao', 'tuition', 'book', 'course',
    ],
  },
  {
    categoryHints: ['compras', 'shopping', 'vestuario', 'roupa', 'eletronico'],
    keywords: [
      'amazon', 'mercado livre', 'shopee', 'shein', 'magalu', 'magazine luiza', 'americanas',
      'zara', 'renner', 'riachuelo', 'cea', 'nike', 'adidas', 'roupa', 'tenis', 'calcado',
      'clothes', 'shoes', 'store',
    ],
  },
  {
    categoryHints: ['pet', 'animais', 'cachorro', 'gato'],
    keywords: ['petz', 'cobasi', 'racao', 'veterinario', 'banho e tosa', 'petshop', 'vet'],
  },
  {
    categoryHints: ['salario', 'salary', 'trabalho', 'renda', 'income', 'freelance'],
    keywords: ['salario', 'pagamento', 'holerite', 'adiantamento', '13o', 'decimo terceiro', 'ferias', 'bonus', 'plr', 'freelance', 'freela', 'nota fiscal', 'pix recebido', 'salary', 'payroll', 'paycheck'],
  },
  {
    categoryHints: ['invest', 'rendimento', 'dividendo', 'juros', 'yield'],
    keywords: ['dividendo', 'jcp', 'rendimento', 'cdb', 'tesouro', 'fii', 'cashback', 'dividend', 'interest'],
  },
];

/**
 * Attempts to match a transaction description to one of the user's categories locally
 * with zero network latency and zero API token usage.
 *
 * Priority:
 * 1. User's own historical categorized transactions (frequency-weighted).
 * 2. Built-in bilingual keyword heuristics matched against user's existing categories.
 */
export function matchCategoryLocally(
  description: string,
  type: 'income' | 'expense',
  categories: Category[],
  pastExpenses: Expense[]
): LocalCategoryMatch | null {
  const normalizedDesc = normalizeText(description);
  if (normalizedDesc.length < 2) return null;

  const validCategories = categories.filter((c) => c.type === type);
  if (validCategories.length === 0) return null;

  const validCategoryIds = new Set(validCategories.map((c) => c.id));

  // Layer 1: User's own historical transactions
  const exactCounts = new Map<string, number>();
  const partialCounts = new Map<string, number>();

  for (const exp of pastExpenses) {
    if (!exp.category_id || !validCategoryIds.has(exp.category_id)) continue;
    const expType = exp.type || 'expense';
    if (expType !== type) continue;

    // Strip installment suffix like "(1/10)" before comparing
    const cleanExpDesc = normalizeText(exp.description.replace(/\(\d+\/\d+\)/g, ''));
    if (!cleanExpDesc) continue;

    if (cleanExpDesc === normalizedDesc) {
      exactCounts.set(exp.category_id, (exactCounts.get(exp.category_id) ?? 0) + 1);
    } else if (
      normalizedDesc.length >= 3 &&
      (cleanExpDesc.includes(normalizedDesc) || normalizedDesc.includes(cleanExpDesc))
    ) {
      partialCounts.set(exp.category_id, (partialCounts.get(exp.category_id) ?? 0) + 1);
    }
  }

  if (exactCounts.size > 0) {
    const [bestId] = Array.from(exactCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    return { categoryId: bestId, confidence: 'high', source: 'history' };
  }

  if (partialCounts.size > 0) {
    const [bestId] = Array.from(partialCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    return { categoryId: bestId, confidence: 'medium', source: 'history' };
  }

  // Layer 2: Built-in keyword heuristics matched against user's category names
  for (const group of KEYWORD_GROUPS) {
    const matchedKeyword = group.keywords.some((kw) => {
      const normKw = normalizeText(kw);
      return (
        normalizedDesc === normKw ||
        normalizedDesc.split(' ').includes(normKw) ||
        (normKw.length >= 4 && normalizedDesc.includes(normKw))
      );
    });

    if (matchedKeyword) {
      const targetCategory = validCategories.find((cat) => {
        const normCat = normalizeText(cat.name);
        return group.categoryHints.some((hint) => normCat.includes(hint));
      });

      if (targetCategory) {
        return { categoryId: targetCategory.id, confidence: 'medium', source: 'keyword' };
      }
    }
  }

  return null;
}
