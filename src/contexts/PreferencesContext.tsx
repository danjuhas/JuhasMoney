import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import i18n from '../lib/i18n';

interface Preferences {
  name: string;
  language: string;
  currency: string;
  onboarding_completed: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
  loading: boolean;
}

const defaultPreferences: Preferences = {
  name: '',
  language: 'pt',
  currency: 'BRL',
  onboarding_completed: false,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        setPreferences({
          name: metadata.name || '',
          language: metadata.language || 'pt',
          currency: metadata.currency || 'BRL',
          onboarding_completed: metadata.onboarding_completed || false,
        });
        if (metadata.language) {
          i18n.changeLanguage(metadata.language);
        }
      }
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        setPreferences({
          name: metadata.name || '',
          language: metadata.language || 'pt',
          currency: metadata.currency || 'BRL',
          onboarding_completed: metadata.onboarding_completed || false,
        });
        if (metadata.language) {
          i18n.changeLanguage(metadata.language);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updatePreferences = async (newPrefs: Partial<Preferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    if (newPrefs.language) {
      i18n.changeLanguage(newPrefs.language);
    }
    
    // Update Supabase metadata
    await supabase.auth.updateUser({
      data: updated
    });
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
