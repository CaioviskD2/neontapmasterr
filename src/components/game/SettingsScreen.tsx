import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  getSettings,
  saveSettings,
  applyTheme,
  type Theme,
} from '@/lib/settings';
import { getSoundEnabled, setSoundEnabled } from '@/lib/sounds';
import { setMusicEnabled, playHomeMusic } from '@/lib/music';
import { t, getLanguage, setLanguage, type Language } from '@/i18n';

interface Props {
  onBack: () => void;
}

const THEMES: { id: Theme; label: string; preview: string }[] = [
  { id: 'green', label: 'NEON GREEN', preview: '🟢' },
  { id: 'blue',  label: 'NEON BLUE',  preview: '🔵' },
  { id: 'purple', label: 'CYBER PURPLE', preview: '🟣' },
];

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' },
];

const SettingsScreen: React.FC<Props> = ({ onBack }) => {
  const [settings, setSettings] = useState(getSettings);
  const [lang, setLang] = useState<Language>(getLanguage);
  const [, forceUpdate] = useState(0);

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K],
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings({ [key]: value });
  };

  const handleSound = (val: boolean) => {
    updateSetting('soundOn', val);
    setSoundEnabled(val);
    setMusicEnabled(val);
    if (val) playHomeMusic();
  };

  const handleTheme = (t: Theme) => {
    updateSetting('selectedTheme', t);
    applyTheme(t);
  };

  const handleLanguage = (l: Language) => {
    setLang(l);
    setLanguage(l);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <button
          onPointerDown={onBack}
          className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="font-arcade text-xs neon-text-blue">{t('settings_title')}</h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {/* Sound */}
        <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <div>
            <p className="font-arcade text-[10px] text-foreground mb-1">{t('settings_sound')}</p>
            <p className="font-orbitron text-xs text-muted-foreground">{t('settings_sound_desc')}</p>
          </div>
          <Switch
            checked={settings.soundOn}
            onCheckedChange={handleSound}
          />
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <div>
            <p className="font-arcade text-[10px] text-foreground mb-1">{t('settings_vibration')}</p>
            <p className="font-orbitron text-xs text-muted-foreground">{t('settings_vibration_desc')}</p>
          </div>
          <Switch
            checked={settings.vibrationOn}
            onCheckedChange={(v) => updateSetting('vibrationOn', v)}
          />
        </div>

        {/* Theme */}
        <div className="px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <p className="font-arcade text-[10px] text-foreground mb-4">{t('settings_theme')}</p>
          <div className="space-y-2">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onPointerDown={() => handleTheme(th.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all active:scale-[0.98] ${
                  settings.selectedTheme === th.id
                    ? 'border-neon-blue bg-neon-blue/10'
                    : 'border-border/40 hover:border-border'
                }`}
              >
                <span className="text-xl">{th.preview}</span>
                <span className="font-arcade text-[9px] text-foreground">{th.label}</span>
                {settings.selectedTheme === th.id && (
                  <span className="ml-auto font-arcade text-[7px] neon-text-blue">{t('settings_active')}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <p className="font-arcade text-[10px] text-foreground mb-4">{t('settings_language')}</p>
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onPointerDown={() => handleLanguage(l.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all active:scale-[0.98] ${
                  lang === l.id
                    ? 'border-neon-blue bg-neon-blue/10'
                    : 'border-border/40 hover:border-border'
                }`}
              >
                <span className="text-xl">{l.id === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
                <span className="font-arcade text-[9px] text-foreground">{l.label}</span>
                {lang === l.id && (
                  <span className="ml-auto font-arcade text-[7px] neon-text-blue">{t('settings_active')}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
