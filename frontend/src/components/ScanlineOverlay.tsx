import { useSettingsStore } from '../store/settingsStore';

export function ScanlineOverlay() {
  const { scanlines, vignette } = useSettingsStore();
  return (
    <>
      {scanlines && <div className="scanlines" aria-hidden />}
      {vignette  && <div className="crt-vignette" aria-hidden />}
    </>
  );
}
