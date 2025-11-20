import { badHabitRoasts, goodHabitRoasts, coachMilitaryRoasts, autoDerisionRoasts, routineRoasts } from './roastMessages'

const pick = (pool: readonly string[]) => pool[Math.floor(Math.random() * pool.length)]

const formatHabit = (habitName: string) => (habitName ? `« ${habitName} »` : 'cette habitude')

export function getRoastForBadHabit(habitName: string, streak: number, totalCraquages: number): string {
  const label = formatHabit(habitName)
  const streakLine =
    streak >= 10
      ? `Tu collectionnes les craquages comme des trophées (${streak} d'affilée).`
      : streak >= 3
      ? `Trois jours ou plus à répéter ${label}, tu es en mode auto-sabotage premium.`
      : streak === 0
      ? `T'as réussi à rester clean récemment, ne flingue pas le score avec ${label}.`
      : `Tu rechutes encore sur ${label}.`

  const volumeLine =
    totalCraquages > 25
      ? 'Ton compteur explose, même les mauvaises habitudes demandent une pause.'
      : totalCraquages > 10
      ? `Tu as cumulé ${totalCraquages} craquages. Tu veux un abonnement fidélité ?`
      : totalCraquages === 0
      ? 'Tiens bon, tu prouves que résister est possible.'
      : `Encore ${totalCraquages} entrées dans la colonne rouge.`

  return `${streakLine} ${volumeLine} ${pick(badHabitRoasts)}`
}

export function getRoastForGoodHabit(habitName: string, streak: number): string {
  const label = formatHabit(habitName)
  const streakLine =
    streak >= 15
      ? `${streak} jours de suite. Continue avant que ton ego ne fasse une pause.`
      : streak >= 5
      ? `${streak} jours alignés sur ${label}. Pas encore un record, mais ça ressemble à une vraie routine.`
      : streak >= 1
      ? `Tu tiens ${streak} jour(s). Ne sabote pas cette série ridicule maintenant.`
      : `Pas de streak pour ${label}. Il serait temps de commencer.`

  const base = pick(goodHabitRoasts)
  return `${streakLine} ${base}`
}

export function getRoastForDayContext(hour: number): string {
  if (hour < 6) {
    return `Insomnie productive ou délayage nocturne ? ${pick(routineRoasts)}`
  }
  if (hour < 12) {
    return `Matin frais, excuses usées. ${pick(routineRoasts)}`
  }
  if (hour < 18) {
    return `Après-midi piégeuse. Ton énergie s'évapore, ta discipline devrait rester. ${pick(routineRoasts)}`
  }
  return `Fin de journée, moment préféré des regrets. ${pick(routineRoasts)}`
}

export function getRoastForAction(action: 'craquage' | 'success' | 'correction'): string {
  if (action === 'craquage') {
    return `Craquage détecté. ${pick(badHabitRoasts)}`
  }
  if (action === 'success') {
    const praise = pick(goodHabitRoasts)
    const push = pick(coachMilitaryRoasts)
    return `${praise} ${push}`
  }
  return `Correction appliquée. ${pick(autoDerisionRoasts)}`
}

export function getAutoDerisionLine() {
  return pick(autoDerisionRoasts)
}

export function getCoachPushLine() {
  return pick(coachMilitaryRoasts)
}
