
import { Home, PieChart, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  activeTab: 'home' | 'insights' | 'settings';
  setActiveTab: (tab: 'home' | 'insights' | 'settings') => void;
};

export const MobileNav = ({ activeTab, setActiveTab }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg shadow-black/20 rounded-full z-50 sm:hidden">
      <div className="flex justify-around items-center h-14 px-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'insights' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.insights')}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'settings' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.settings')}</span>
        </button>
      </div>
    </div>
  );
};
