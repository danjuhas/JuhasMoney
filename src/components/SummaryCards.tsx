

interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendente: number;
}

export function SummaryCards({ totalReceitas, totalDespesas, saldo, totalPendente }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Receitas</h2>
         <p className="text-lg sm:text-xl font-bold text-green-600 truncate" title={totalReceitas.toString()}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalReceitas)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Despesas</h2>
         <p className="text-lg sm:text-xl font-bold text-red-600 truncate" title={totalDespesas.toString()}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalDespesas)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Saldo</h2>
         <p className={`text-lg sm:text-xl font-bold truncate ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} title={saldo.toString()}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(saldo)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Pendentes</h2>
         <p className="text-lg sm:text-xl font-bold text-orange-600 truncate" title={totalPendente.toString()}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalPendente)}
         </p>
      </div>
    </div>
  );
}

