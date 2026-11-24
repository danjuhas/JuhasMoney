import { useState } from 'react';
import { Smartphone, Download, ExternalLink, X, Share, PlusSquare, CheckCircle, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export function PWAInstallBanner() {
  const { isIOS, canPromptNative, shouldShowBanner, dismiss, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (!shouldShowBanner) {
    return null;
  }

  const handleActionClick = async () => {
    if (canPromptNative) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div 
        data-testid="pwa-install-banner"
        className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              Instale o JuhasMoney no celular
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Adicione à tela de início para usar como um aplicativo, sem barras de navegador.
            </p>
            <button
              onClick={handleActionClick}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
            >
              {canPromptNative ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Instalar Aplicativo
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver como adicionar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} maxWidth="sm" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Adicionar à Tela de Início
            </h3>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Siga os passos abaixo no navegador do seu celular para criar o atalho com tela cheia:
        </p>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <div className="p-1.5 bg-slate-700 rounded-lg text-emerald-400 shrink-0 mt-0.5">
              {isIOS ? <Share className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Passo 1: </span>
              {isIOS ? (
                <>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Navegador.</>
              ) : (
                <>Toque no <strong>menu de três pontinhos</strong> (⋮) no canto do seu navegador.</>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <div className="p-1.5 bg-slate-700 rounded-lg text-emerald-400 shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Passo 2: </span>
              Role o menu e selecione a opção <strong>"Adicionar à Tela de Início"</strong> ou <strong>"Instalar aplicativo"</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <div className="p-1.5 bg-slate-700 rounded-lg text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Passo 3: </span>
              Confirme tocando em <strong>"Adicionar"</strong>. O ícone do JuhasMoney aparecerá na sua tela inicial!
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => setShowGuide(false)}
            variant="primary"
            className="w-full text-xs py-2.5"
          >
            Entendi
          </Button>
        </div>
      </Modal>
    </>
  );
}

