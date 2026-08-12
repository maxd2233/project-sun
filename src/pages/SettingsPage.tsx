import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppState } from '../store/context';
import { resetAll, setTheme, setUserName, updateMission } from '../store/actions';
import {
  downloadBackup,
  getBackupSummary,
  parseBackup,
  serializeBackup,
  type BackupSummary,
} from '../services/backup';
import { saveState } from '../services/persistence';
import type { AppState, ThemePreference } from '../types';

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

/** Local settings: profile, mission config, appearance and data. */
export function SettingsPage() {
  const { state, dispatch } = useAppState();
  const { mission, settings } = state;
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    state: AppState;
    summary: BackupSummary;
  } | null>(null);
  const [backupMsg, setBackupMsg] = useState<{
    kind: 'ok' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setBackupMsg(null);
    try {
      downloadBackup(serializeBackup(state));
      setBackupMsg({ kind: 'ok', text: 'Backup descargado. Guardalo en un lugar seguro.' });
    } catch (error) {
      setBackupMsg({
        kind: 'error',
        text: error instanceof Error ? error.message : 'No se pudo exportar los datos.',
      });
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setBackupMsg(null);
    try {
      const restored = parseBackup(await file.text());
      setPendingImport({ state: restored, summary: getBackupSummary(restored) });
    } catch (error) {
      setBackupMsg({
        kind: 'error',
        text: error instanceof Error ? error.message : 'El archivo no es un backup válido.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    // Persist synchronously first so the reload boots with the restored data.
    if (!saveState(pendingImport.state)) {
      setBackupMsg({ kind: 'error', text: 'No se pudo guardar el backup en este dispositivo.' });
      setPendingImport(null);
      return;
    }
    setPendingImport(null);
    setBackupMsg({ kind: 'ok', text: 'Datos restaurados.' });
    window.setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="page">
      <AppHeader title="Ajustes" subtitle="Perfil, misión, aspecto y datos." />

      <Card title="Perfil">
        <div className="field">
          <label className="field__label" htmlFor="user-name">
            Tu nombre
          </label>
          <input
            id="user-name"
            className="input"
            type="text"
            value={settings.userName}
            maxLength={20}
            onChange={(e) => dispatch(setUserName(e.target.value.toUpperCase()))}
          />
        </div>
      </Card>

      <Card title="Misión diaria">
        <div className="field">
          <label className="field__label" htmlFor="mission-title">
            Nombre de la misión
          </label>
          <input
            id="mission-title"
            className="input"
            type="text"
            value={mission.title}
            maxLength={40}
            onChange={(e) => dispatch(updateMission({ title: e.target.value }))}
          />
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label className="field__label" htmlFor="mission-time">
            Hora programada
          </label>
          <input
            id="mission-time"
            className="input"
            type="time"
            value={mission.scheduledTime}
            onChange={(e) => {
              if (e.target.value) dispatch(updateMission({ scheduledTime: e.target.value }));
            }}
          />
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={mission.enabled}
            onChange={(e) => dispatch(updateMission({ enabled: e.target.checked }))}
          />
          <span className="field__label" style={{ margin: 0 }}>
            Misión activada
          </span>
        </label>
      </Card>

      <Card title="Apariencia">
        <div className="field">
          <span className="field__label" id="theme-label">
            Tema
          </span>
          <div role="group" aria-labelledby="theme-label" style={{ display: 'flex', gap: '0.5rem' }}>
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={settings.theme === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => dispatch(setTheme(option.value))}
                aria-pressed={settings.theme === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Datos">
        <p className="page__desc" style={{ marginBottom: '1rem' }}>
          Todo se guarda localmente en este dispositivo. No hay cuenta ni nada
          que salga de tu teléfono.
        </p>

        {pendingImport ? (
          <div className="backup-confirm" role="alert">
            <p className="page__desc">
              Se va a reemplazar toda la información actual con este backup:
            </p>
            <ul className="backup-confirm__list">
              <li>{pendingImport.summary.completedDays} días completados</li>
              <li>{pendingImport.summary.achievements} logros · {pendingImport.summary.xp} XP</li>
              <li>Misión: “{pendingImport.summary.missionTitle}”</li>
            </ul>
            <div className="backup-confirm__actions">
              <Button variant="primary" size="sm" onClick={confirmImport}>
                Reemplazar datos
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPendingImport(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="backup-actions">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={16} aria-hidden="true" />
              Exportar datos
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} aria-hidden="true" />
              Importar datos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              aria-label="Seleccionar un archivo de backup"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
          </div>
        )}

        {backupMsg && (
          <p
            className={`backup-msg backup-msg--${backupMsg.kind}`}
            role="status"
          >
            {backupMsg.text}
          </p>
        )}

        {confirmReset ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="danger" onClick={() => dispatch(resetAll())}>
              Borrar todo
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            Reiniciar todos los datos…
          </Button>
        )}
      </Card>
    </div>
  );
}
