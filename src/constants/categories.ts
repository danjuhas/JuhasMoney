import { Home, Car, ShoppingCart, Coffee, HeartPulse, GraduationCap, Plane, Gamepad2, Gift, Wrench, Smartphone, Music, Shirt, Book, Tag, Briefcase } from 'lucide-react';
import type { Category } from '../types';

export const AVAILABLE_ICONS = {
  Home, Car, ShoppingCart, Coffee, HeartPulse, GraduationCap, Plane, 
  Gamepad2, Gift, Wrench, Smartphone, Music, Shirt, Book, Tag, Briefcase
};

export const AVAILABLE_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500'
];

export function getCategoryStyle(category: Category | null | undefined) {
  if (!category) {
    return {
      Icon: Tag,
      bgColor: 'bg-slate-700/80',
      textColor: 'text-slate-300'
    };
  }

  const Icon = category.icon && AVAILABLE_ICONS[category.icon as keyof typeof AVAILABLE_ICONS]
    ? AVAILABLE_ICONS[category.icon as keyof typeof AVAILABLE_ICONS]
    : Tag;

  const bgColor = category.color || (category.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500');
  const textColor = category.color ? 'text-white' : 'text-slate-300';

  return { Icon, bgColor, textColor };
}

