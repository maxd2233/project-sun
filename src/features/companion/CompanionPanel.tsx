import { useAppState } from '../../store/context';
import { Card } from '../../components/ui/Card';
import { getStageProgress } from './evolution';
import { Companion } from './Companion';

/**
 * The full companion card for the stats section: Solín's current form,
 * speech bubble and the evolution progress bar toward the next stage.
 */
export function CompanionPanel() {
  const { state } = useAppState();
  const stageInfo = getStageProgress(state.progress.totalCompleted);

  return (
    <Card className="companion-panel">
      <div className="companion-panel__head">
        <span className="card__title">SOLÍN · COMPAÑERO</span>
        <span className="badge badge--accent">{stageInfo.stage.name}</span>
      </div>

      <div className="companion-panel__body">
        <Companion />
      </div>

      <div className="companion-panel__meta">
        {stageInfo.next ? (
          <>
            <p className="page__desc">
              {stageInfo.daysToNext === 1 ? '1 día' : `${stageInfo.daysToNext} días`} para{' '}
              {stageInfo.next.name}
            </p>
            <div
              className="companion-panel__progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(stageInfo.progress * 100)}
              aria-label={`Progreso hacia ${stageInfo.next.name}`}
            >
              <div
                className="companion-panel__progress-fill"
                style={{ width: `${stageInfo.progress * 100}%` }}
              />
            </div>
          </>
        ) : (
          <p className="page__desc">Forma máxima alcanzada. Solín brilla con todo. ✨</p>
        )}
      </div>
    </Card>
  );
}
