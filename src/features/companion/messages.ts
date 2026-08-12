/**
 * Solín's personality: one message pool per mood. Everything here is
 * original and editable — add, remove or reword lines freely. The tone is
 * warm, affectionate and uplifting: Solín celebrates, reassures and never
 * blames. Nothing here sounds clinical or demanding.
 *
 * Messages are picked at random without repeating the previous one of the
 * same pool (see `createMessagePicker`), which keeps the personality lively
 * instead of looping on a single catchphrase.
 */

export type CompanionMoodKey =
  | 'idle'
  | 'waiting'
  | 'happy'
  | 'celebrating'
  | 'unlocking'
  | 'resting'
  | 'night'
  | 'poke'
  | 'evolution'
  | 'near'
  | 'streak'
  | 'streaktwo'
  | 'care'
  | 'sleeppoke'
  | 'pokehard'
  | 'first'
  | 'returning'
  | 'returningAfterGap';

export const COMPANION_MESSAGES: Record<CompanionMoodKey, readonly string[]> = {
  // Quiet, reassuring moments while he waits for the hour.
idle: [
    'Hoy también estoy con vos. ☀️',
    'A tu ritmo, sin apuro. Acá estoy.',
    'Pase lo que pase, hay sol. ☀️',
    'Me gusta que estés acá. 🥰',
    '¿Listo para que sea un gran día? Te acompaño.',
    'Respirá profundo. Ya vamos a estar. 🌤️',
    'Solin está aquí, esperándote. ☀️',
    'Cada nuevo día es una oportunidad. Sos fuerte. ✨',
    'No estás solo: Solín camina a tu lado. 🌱',
    'El sol vuelve a salir por vos. ☀️',
],
  // The mission hour arrived but nothing was pressed yet — encouraging, zero pressure.
waiting: [
    'Te estoy esperando. Sin presión. 👀',
    'Cuando quieras, la misión te espera. Vamos.',
    'Yo sé que podés. No hace falta más nada.',
    'Seguí a tu ritmo, que acá nadie corre.',
    '☀️ Los rayos están listos cuando digas.',
    'Tranqui: un momento a la vez.',
    'Solin espera tu toque. Acá estoy. ✨',
    'El sol aguarda tu decisión. Hoy es tuyo. 🌞',
    'Un día a la vez. Sos capaz. 💪',
    'Solin envía energía positiva para tu misión. ☀️',
],
  // Mission done during the day — proud, warm.
happy: [
    'MIRÁ LO QUE HICISTE. Estoy orgulloso. 🥹',
    'Otro día bien cuidado. ❤️',
    'Así nomás. Me encanta. ✨',
    'Ese paso es tuyo. Lo lograste vos.',
    'Hoy te ganaste un brillo extra. 😎',
    'Vos podés con esto y con mucho más.',
    'Solin está orgulloso de tu hoy. ☀️',
    'El sol refleja tu buen hacer. ✨',
    'Solin celebra cada logro tuyo. ❤️',
],
  celebrating: [
    '¡SÍ! ¡Qué alegría! 🎉',
    '¡OTRO DÍA! Te aplaudo, mirá. 👏✨',
    '¡Estoy bailando por vos! 🕺☀️',
    '¡Brillante! Eso se festeja.',
    '¡AAA, qué lindo verte así! 🥳',
  ],
  unlocking: [
    '🏆 ¡NUEVO LOGRO! Sos increíble.',
    '✨ Se encendió una estrella. Tuya.',
    '🎖️ Esto no es casualidad: es constancia tuya.',
    '🌟 No sos uno más. Nunca lo fuiste.',
    'Mirá lo que lograste. Seguí así. ❤️',
  ],
  // Night + mission still pending: Solín sleeps, but warmly.
  resting: [
    'Dormí tranquilo. Yo cuido el sol hasta mañana. 🌙',
    'Zzz… te quiero mucho. Mañana sigue. 💤',
    'Descansá, que el cielo se queda conmigo. 🌌',
    'Mañana hay otro sol esperándote. 💛',
  ],
  // Night + mission done: Solín keeps him company under the moon.
  night: [
    'Buenas noches, campeón. Te lo ganaste. 🌟',
    'La luna aprueba tu día. Y yo también. 🌙',
    'Descansá: hoy fue tuyo. 💛',
    'Mirá las estrellas: una brilla por vos. ✨',
  ],
  poke: [
    '¡Jejé! Eso me gusta. 😄',
    '¡Otra vez! Bueno, te dejo. 🥰',
    '¿Qué mirás? ¡Seguí brillando! ✨',
    'Ay, me encanta que juegues conmigo. ♥',
  ],
  evolution: [
    '🌟 ¡MIRÁ! Crecí con vos.',
    '✨ Cada día con vos me hace más fuerte.',
    '🎉 Crecí porque vos seguís. Qué honor.',
    '☀️ Mi forma nueva es gracias a tu constancia.',
  ],
  near: [
    '☀️ Falta poquito. Ya calenté los rayos para hoy.',
    '⏳ La misión está por llegar. Vos tranquilo.',
    '✨ Casi, casi. Todo listo para que brilles.',
  ],
streak: [
    '🔥 La racha creció. Y es toda tuya.',
    '☀️ Otro día que te cuidás. Eso me encanta.',
    '🏆 La constancia tuya hace cosquillas solares.',
    'Cada día seguís acá. Eso vale oro. 💛',
    'Solin brilla más con cada día de tu racha. ☀️',
    'El sol celebra tu constancia día a día. ✨',
    'Solin y vos: una racha imparable. 🔥',
],
  // The exact second-day milestone, so day 2 gets its own words.
  streaktwo: [
    '¡DOS DÍAS! ¡Sos un crack! 🔥',
    '¡Día 2! Seguimos, que esto no para. 🔥',
    'Dos días encendidos. Qué bien te hace. ✨',
  ],
  // Emotional, occasional lines — never spammed, picked with low chance.
care: [
    'Te quiero, sabés. 💛',
    'Estoy orgulloso de vos. De verdad. ☀️',
    'No importa cómo haya sido el día: acá estoy.',
    'Cuidarte es de fuerte, ¿eh? ❤️',
    'Vos podés. Y si parece que no, io te repito que podés. ✨',
    'Hoy hiciste lo tuyo. Descansá tranquilo. 💛',
    'Lo importante no es ser perfecto. Es seguir acá.',
    'Este sol se enciende por vos cada día. ☀️',
    'Te mando un abrazo de rayos. 🫂',
    'Seguimos. Acá no se rinde nadie.',
    'Un día a la vez. Y vas muy bien. 🌱',
    'Solin camina contigo en cada paso. ☀️',
    'El sol te acompaña siempre, aunque no lo veas. ✨',
    'Solin siente tu alegría cuando cuidas el día. ❤️',
    'Cada día que pasa, solin crece más contigo. 🌱',
],
  sleeppoke: [
    'Shhh… estoy durmiendo. Te quiero igual. 😴',
    'Zzz… mañana seguimos. Besito. 🌙',
    '¿No dormís? Bueno, te acompaño un ratito. 💤',
  ],
  pokehard: [
    'Bueno… ya sé que me querés tocar 😂',
    'Tocame despacio, soy tu amigo, eh 😄',
    'Ya sé que estás acá. Y me alegra. ✨',
  ],
  first: [
    '☀️ Hola, soy Solín. Vengo a acompañarte todos los días.',
    '✨ Primer día juntos. Ya te quiero. Traje rayos de bolsillo.',
    'Hola. Hoy empieza algo lindo. ☀️',
  ],
  returning: [
    '☀️ Te estaba esperando. Me alegra verte.',
    '✨ Qué bueno verte de nuevo. Hoy también vamos a brillar.',
    '🫡 Solín en su puesto. Y feliz de que estés acá.',
  ],
  returningAfterGap: [
    '☀️ Qué bueno verte. Acá nadie se queda afuera.',
    '✨ Volviste: los rayos guardaban tu lugar. Y tu lugar te esperaba.',
    'El pato dice: “ah, hola”. Y yo digo que me alegra mucho. 🦆💛',
  ],
};

export type CompanionMessagePicker = (mood: CompanionMoodKey) => string;

/**
 * Build a picker that avoids repeating the previous message of each pool.
 * One instance should live per Companion instance (e.g. in a ref).
 */
export function createMessagePicker(): CompanionMessagePicker {
  const lastByPool = new Map<CompanionMoodKey, number>();

  return (mood: CompanionMoodKey): string => {
    const pool = COMPANION_MESSAGES[mood];
    if (pool.length === 0) return '';
    if (pool.length === 1) return pool[0];

    let index = lastByPool.get(mood) ?? -1;
    while (index === lastByPool.get(mood)) {
      index = Math.floor(Math.random() * pool.length);
    }
    lastByPool.set(mood, index);
    return pool[index];
  };
}