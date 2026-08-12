import { motion } from 'motion/react';
import { Check, Lock, Trophy } from 'lucide-react';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  RARITY_META,
  getAchievement,
  type AchievementDef,
} from '../../config/achievements';
import type { AchievementCategory, AchievementUnlock } from '../../types';
import { useAppState } from '../../store/context';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { Card } from '../../components/ui/Card';
import { Stat } from '../../components/ui/Stat';
import '../../styles/achievements.css';

const CATEGORY_ORDER: AchievementCategory[] = ['constancia', 'precision', 'divertidos'];

function formatUnlockedAt(iso: string): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

interface AchievementCardProps {
  def: AchievementDef;
  unlock: AchievementUnlock | undefined;
  index: number;
  reduceMotion: boolean;
}

function AchievementCard({ def, unlock, index, reduceMotion }: AchievementCardProps) {
  const Icon = def.icon;
  const meta = RARITY_META[def.rarity];
  const isUnlocked = unlock !== undefined;

  return (
    <motion.article
      className={`ach-card ach-card--${isUnlocked ? 'unlocked' : 'locked'} ${meta.className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.35), duration: 0.3, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
    >
      <div className="ach-card__top">
        <span className="ach-card__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
        {isUnlocked ? (
          <span className="ach-card__check" aria-label="Desbloqueado">
            <Check size={16} aria-hidden="true" />
          </span>
        ) : (
          <span className="ach-card__lock" aria-label="Bloqueado">
            <Lock size={14} aria-hidden="true" />
          </span>
        )}
      </div>

      <span className="ach-card__rarity">{meta.label}</span>
      <h3 className="ach-card__title">{def.title}</h3>
      <p className="ach-card__desc">{def.description}</p>

      {isUnlocked ? (
        <p className="ach-card__date">Ganado el {formatUnlockedAt(unlock.unlockedAt)}</p>
      ) : (
        <p className="ach-card__req">{def.requirement}</p>
      )}
    </motion.article>
  );
}

interface CategorySectionProps {
  id: AchievementCategory;
  unlocks: Record<string, AchievementUnlock>;
  reduceMotion: boolean;
  baseIndex: number;
}

function CategorySection({ id, unlocks, reduceMotion, baseIndex }: CategorySectionProps) {
  const meta = ACHIEVEMENT_CATEGORIES.find((c) => c.id === id);
  const defs = ACHIEVEMENTS.filter((a) => a.category === id);
  const earned = defs.filter((a) => a.id in unlocks).length;

  return (
    <section className="ach-group" aria-label={meta?.label}>
      <header className="ach-group__header">
        <div className="ach-group__heading">
          <h2 className="ach-group__title">{meta?.label ?? id}</h2>
          <p className="ach-group__desc">{meta?.description}</p>
        </div>
        <span className="ach-group__count">
          {earned}/{defs.length}
        </span>
      </header>
      <div className="achieve-grid">
        {defs.map((def, index) => (
          <AchievementCard
            key={def.id}
            def={def}
            unlock={unlocks[def.id]}
            index={baseIndex + index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Full achievements screen body: summary stats, then the catalogue grouped
 * by category with locked/unlocked cards, rarity treatment and requirement
 * hints on the locked ones.
 */
export function AchievementGrid() {
  const { state } = useAppState();
  const reduceMotion = usePrefersReducedMotion();
  const unlocks = state.progress.achievementUnlocks;
  const earned = Object.keys(unlocks).filter((id) => getAchievement(id) !== undefined).length;
  const totalXp = Object.values(unlocks).reduce((sum, entry) => sum + entry.xpEarned, 0);

  let baseIndex = 0;
  return (
    <section className="ach-section" aria-label="Logros">
      <Card className="ach-summary">
        <Stat label="Desbloqueados" value={`${earned}/${ACHIEVEMENTS.length}`} />
        <Stat label="XP de logros" value={`+${totalXp}`} accent />
        <div className="ach-summary__ring" aria-hidden="true">
          <Trophy size={22} />
        </div>
      </Card>

      {CATEGORY_ORDER.map((id) => {
        const count = ACHIEVEMENTS.filter((a) => a.category === id).length;
        const section = (
          <CategorySection
            key={id}
            id={id}
            unlocks={unlocks}
            reduceMotion={reduceMotion}
            baseIndex={baseIndex}
          />
        );
        baseIndex += count;
        return section;
      })}
    </section>
  );
}
