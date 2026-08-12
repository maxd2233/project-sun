/**
 * Shared Motion presets + easing for the companion. Kept in a JS-only
 * module (no components) so fast refresh stays happy in the .tsx files.
 */

export const COMPANION_EASE = [0.22, 1, 0.36, 1] as const;

/** Gentle endless float. */
export const floatPreset = {
  animate: { y: [0, -7, 0] },
  transition: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' as const },
};

/** Slow body breathing. */
export const breathePreset = {
  animate: { scale: [1, 1.035, 1] },
  transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const },
};
