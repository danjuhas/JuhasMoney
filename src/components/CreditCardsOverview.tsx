import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, CreditCard as CardIcon, Trash2, Edit2 } from 'lucide-react';
import { CreditCardBillModal } from './CreditCardBillModal';
import { usePreferences } from '../contexts/PreferencesContext';
import type { CreditCard } from '../types';
import { useTranslation } from 'react-i18next';

import type { Expense, Category } from '../types';


interface CreditCardsOverviewProps {
  selectedMonth: string;
  cards: CreditCard[];
  expenses: Expense[];
  categories: Category[];
  onTogglePaid: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  addCard: (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => void;
  updateCard: (id: string, updates: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at'>>) => void;
  deleteCard: (id: string, action?: "keep" | "delete_all") => void;
  onAddCardPurchase?: (cardId: string) => void;
}

export function CreditCardsOverview({ cards, expenses, categories, onDeleteExpense, onEditExpense, addCard, updateCard, deleteCard, selectedMonth, onAddCardPurchase }: CreditCardsOverviewProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const { preferences } = usePreferences();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [closingDay, setClosingDay] = useState<number | ''>(25);
  const [dueDay, setDueDay] = useState<number | ''>(5);

  const PRESET_COLORS = [
    '#8b5cf6', // Nubank
    '#f97316', // Itau
    '#ec4899', // C6
    '#10b981', // Next
    '#0ea5e9', // Caixa
    '#ef4444', // Santander
    '#eab308', // BB
    '#1e293b'  // Black
  ];

  const handleOpenModal = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setName(card.name);
      setColor(card.color);
      setClosingDay(card.closing_day);
      setDueDay(card.due_day);
    } else {
      setEditingCard(null);
      setName('');
      setColor('#8b5cf6');
      setClosingDay(25);
      setDueDay(5);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name) return;

    const closing = Number(closingDay) || 1;
    const due = Number(dueDay) || 1;

    if (editingCard) {
      updateCard(editingCard.id, { name, color, closing_day: closing, due_day: due });
    } else {
      addCard({ name, color, closing_day: closing, due_day: due });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <CardIcon className="w-6 h-6 text-emerald-400" />{t('dashboard.my_cards')}</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.new_card')}</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/50 border border-dashed border-slate-700 rounded-3xl">
          <CardIcon className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">{t('dashboard.no_cards')}</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6 text-center max-w-xs">
            {t('dashboard.no_cards_add_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => {
            const today = new Date().getDate();
            const isBestDay = today === card.closing_day;
            
            return (
              <div 
                key={card.id}
                onClick={() => { setSelectedCardId(card.id);  }}
                role="button" 
                className="relative overflow-hidden rounded-2xl p-6 ring-1 ring-inset ring-white/10 shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${card.color}dd, ${card.color}88), #1e293b` }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="font-bold text-xl text-white tracking-widest uppercase opacity-90 drop-shadow-md">
                    {card.name}
                  </div>
                  <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity bg-black/20 rounded-lg p-1">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(card); }} className="p-1.5 text-white hover:text-emerald-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setCardToDelete(card.id); }} className="p-1.5 text-white hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">{t('dashboard.closing')}</p>
                    <p className="text-white font-bold text-lg drop-shadow-md">Dia {card.closing_day}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1 text-right">{t('dashboard.due')}</p>
                    <p className="text-white font-bold text-lg text-right drop-shadow-md">Dia {card.due_day}</p>
                  </div>
                </div>

                {isBestDay && (
                  <div className="absolute top-0 right-0 left-0 bg-emerald-500 text-white text-xs font-bold uppercase text-center py-1">{t('dashboard.best_buy_day')}</div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Modal Detalhes da Fatura */}
      <CreditCardBillModal
        onAddPurchase={() => { if (selectedCardId && onAddCardPurchase) { onAddCardPurchase(selectedCardId); } }}
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
        expenses={expenses}
        categories={categories}
        cards={cards}
        initialMonth={selectedMonth}
        onDeleteExpense={onDeleteExpense}
        onEditExpense={onEditExpense}
        preferences={preferences}
      />

      {/* Modal Novo Cartão */}
      {isModalOpen && (
      <Modal isOpen={true} onClose={() => setIsModalOpen(false)} maxWidth="md" className="p-6" zIndex="z-[60]">
            <h2 className="text-xl font-bold text-slate-100 mb-6">
              {editingCard ? t('dashboard.edit_card') : t('dashboard.new_card')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t('dashboard.card_name')}</label>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, C6, Itau..." maxLength={20} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t('dashboard.card_color')}</label>
                <div className="flex gap-3 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-800' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('dashboard.card_closing')}</label>
                  <Input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('dashboard.card_due')}</label>
                  <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">{t('dashboard.cancel')}</Button>
                <Button variant="primary" onClick={handleSave} disabled={!name} className="flex-1">{t('dashboard.save_card')}</Button>
              </div>
            </div>
          </Modal>
      )}

            {cardToDelete && (
      <Modal isOpen={true} onClose={() => setCardToDelete(null)} maxWidth="md" className="p-6" zIndex="z-[60]">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{t('modal.delete_card_title')}</h3>
            
            {(() => {
              const cardExpenses = expenses.filter(e => e.credit_card_id === cardToDelete);
              
              if (cardExpenses.length === 0) {
                return (
                  <>
                    <p className="text-slate-400 text-sm mb-6">{t('modal.delete_card_desc_empty')}</p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="secondary" onClick={() => setCardToDelete(null)}>{t('modal.cancel')}</Button>
                      <Button variant="danger" onClick={() => { deleteCard(cardToDelete); setCardToDelete(null); }}>{t('modal.delete')}</Button>
                    </div>
                  </>
                );
              }

              return (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    {t('modal.delete_card_desc_with_expenses', { count: cardExpenses.length })}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button variant="secondary" onClick={() => setCardToDelete(null)}>{t('modal.cancel')}</Button>
                    <Button variant="secondary" onClick={() => { deleteCard(cardToDelete, 'keep'); setCardToDelete(null); }}>{t('modal.delete_card_keep')}</Button>
                    <Button variant="danger" onClick={() => { deleteCard(cardToDelete, 'delete_all'); setCardToDelete(null); }}>{t('modal.delete_card_delete_all')}</Button>
                  </div>
                </>
              );
            })()}
                </Modal>
      )}
    </div>
  );
}
