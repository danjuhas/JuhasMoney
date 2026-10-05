import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Logout() {
  useEffect(() => {
    const performLogout = async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    };
    
    performLogout();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm font-medium">Saindo com segurança...</p>
    </div>
  );
}
