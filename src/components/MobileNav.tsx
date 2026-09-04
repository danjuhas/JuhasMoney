
import { Home, PieChart, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  activeTab: 'home' | 'insights' | 'settings';
  setActiveTab: (tab: 'home' | 'insights' | 'settings') => void;
};

export const MobileNav = ({ activeTab, setActiveTab }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-50 sm:hidden">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'home' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'insights' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.insights')}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('nav.settings')}</span>
        </button>
      </div>
    </div>
  );
};
