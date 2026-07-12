/* global React, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSlider */
const { useEffect } = React;

const ACCENTS = {
  orange:   { sw: '#F5691E', gold: '#F5691E', deep: '#D14E0C', bright: '#FF8240', rgb: '245 105 30' },
  ember:    { sw: '#E8541C', gold: '#E8541C', deep: '#BE3F0E', bright: '#FF7A3A', rgb: '232 84 28' },
  amber:    { sw: '#F59121', gold: '#F59121', deep: '#D2740C', bright: '#FFAD4D', rgb: '245 145 33' },
  graphite: { sw: '#3A3A3A', gold: '#3A3A3A', deep: '#222222', bright: '#555555', rgb: '58 58 58' },
};
const SWATCH_TO_KEY = Object.fromEntries(Object.entries(ACCENTS).map(([k, v]) => [v.sw, k]));

const DISPLAY_FONTS = {
  'נקי': '"Heebo", "Noto Sans Hebrew", Arial, sans-serif',
  'רחב': '"Assistant", "Heebo", sans-serif',
};
const BTN_SHAPES = { 'מעוגל': '999px', 'רך': '12px', 'חד': '4px' };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#F5691E",
  "displayFont": "נקי",
  "btnShape": "מעוגל",
  "cardRadius": 14
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const root = document.documentElement;

  useEffect(() => {
    const a = ACCENTS[SWATCH_TO_KEY[t.accent] || 'orange'];
    root.style.setProperty('--gold', a.gold);
    root.style.setProperty('--gold-deep', a.deep);
    root.style.setProperty('--gold-bright', a.bright);
    root.style.setProperty('--gold-rgb', a.rgb);
  }, [t.accent]);

  useEffect(() => {
    root.style.setProperty('--display', DISPLAY_FONTS[t.displayFont] || DISPLAY_FONTS['נקי']);
  }, [t.displayFont]);

  useEffect(() => {
    root.style.setProperty('--btn-radius', BTN_SHAPES[t.btnShape] || '999px');
  }, [t.btnShape]);

  useEffect(() => {
    root.style.setProperty('--radius', t.cardRadius + 'px');
    root.style.setProperty('--radius-sm', Math.max(6, t.cardRadius - 4) + 'px');
  }, [t.cardRadius]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="מותג" />
      <TweakColor label="צבע אקסנט" value={t.accent}
        options={Object.values(ACCENTS).map((v) => v.sw)}
        onChange={(v) => setTweak('accent', v)} />
      <TweakRadio label="גופן כותרות" value={t.displayFont}
        options={Object.keys(DISPLAY_FONTS)}
        onChange={(v) => setTweak('displayFont', v)} />
      <TweakSection label="צורה" />
      <TweakRadio label="כפתורים" value={t.btnShape}
        options={Object.keys(BTN_SHAPES)}
        onChange={(v) => setTweak('btnShape', v)} />
      <TweakSlider label="עיגול כרטיסים" value={t.cardRadius} min={4} max={22} step={1} unit="px"
        onChange={(v) => setTweak('cardRadius', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
