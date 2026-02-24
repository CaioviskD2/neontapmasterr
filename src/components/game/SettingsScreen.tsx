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
import { getDifficulty, setDifficulty, ALL_DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { SKINS, getSelectedSkin, setSelectedSkin } from '@/lib/skins';

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

const DIFF_I18N: Record<Difficulty, string> = {
  easy: 'diff_easy',
  normal: 'diff_normal',
  hard: 'diff_hard',
  insane: 'diff_insane',
};

const DIFF_EMOJI: Record<Difficulty, string> = {
  easy: '🟢',
  normal: '🟡',
  hard: '🔴',
  insane: '💀',
};

const SettingsScreen: React.FC<Props> = ({ onBack }) => {
  const [settings, setSettings] = useState(getSettings);
  const [lang, setLang] = useState<Language>(getLanguage);
  const [diff, setDiff] = useState<Difficulty>(getDifficulty);
  const [activeSkin, setActiveSkin] = useState(getSelectedSkin);
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

  const handleDifficulty = (d: Difficulty) => {
    setDiff(d);
    setDifficulty(d);
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

        {/* Difficulty */}
        <div className="px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <p className="font-arcade text-[10px] text-foreground mb-4">{t('diff_title')}</p>
          <div className="space-y-2">
            {ALL_DIFFICULTIES.map((d) => (
              <button
                key={d}
                onPointerDown={() => handleDifficulty(d)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all active:scale-[0.98] ${
                  diff === d
                    ? 'border-neon-blue bg-neon-blue/10'
                    : 'border-border/40 hover:border-border'
                }`}
              >
                <span className="text-xl">{DIFF_EMOJI[d]}</span>
                <span className="font-arcade text-[9px] text-foreground">{t(DIFF_I18N[d] as any)}</span>
                {diff === d && (
                  <span className="ml-auto font-arcade text-[7px] neon-text-blue">{t('settings_active')}</span>
                )}
              </button>
            ))}
          </div>
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
        {/* Skins */}
        <div className="px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
          <p className="font-arcade text-[10px] text-foreground mb-4">{t('skins_title')}</p>
          <div className="space-y-2">
            {SKINS.map((skin) => {
              const unlocked = skin.isUnlocked();
              const previewColor = skin.primaryColor;
              const isGradient = skin.styleType === 'gradient' && skin.secondaryColor;
              const previewBg = !previewColor ? undefined
                : isGradient ? `linear-gradient(135deg, hsl(${skin.primaryColor}), hsl(${skin.secondaryColor}))` 
                : `hsl(${previewColor})`;
              const previewBorder = skin.styleType === 'elite' && previewColor
                ? `2px solid hsl(${previewColor} / 0.8)` : undefined;
              return (
                <button
                  key={skin.id}
                  onPointerDown={() => {
                    if (unlocked) {
                      setActiveSkin(skin.id);
                      setSelectedSkin(skin.id);
                    }
                  }}
                  disabled={!unlocked}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all active:scale-[0.98] ${
                    activeSkin === skin.id && unlocked
                      ? 'border-neon-blue bg-neon-blue/10'
                      : unlocked
                        ? 'border-border/40 hover:border-border'
                        : 'border-border/20 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {previewBg ? (
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ background: previewBg, border: previewBorder }}
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-neon-green flex-shrink-0" />
                  )}
                  <span className="font-arcade text-[9px] text-foreground">{t(skin.nameKey as any)}</span>
                  {!unlocked && (
                    <span className="ml-auto font-arcade text-[7px] text-muted-foreground">{t('skin_locked')}</span>
                  )}
                  {unlocked && activeSkin === skin.id && (
                    <span className="ml-auto font-arcade text-[7px] neon-text-blue">{t('skin_equipped')}</span>
                  )}
                  {unlocked && activeSkin !== skin.id && (
                    <span className="ml-auto font-orbitron text-[9px] text-muted-foreground">{t(skin.unlockKey as any)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
