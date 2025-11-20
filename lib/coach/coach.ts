import {
  getRoastForAction,
  getRoastForBadHabit,
  getRoastForDayContext,
  getRoastForGoodHabit,
  getAutoDerisionLine,
  getCoachPushLine,
} from './roastLogic'

type CoachRoastInput = {
  habitName: string
  type: 'good' | 'bad'
  streak?: number
  totalLogs?: number
  totalCraquages?: number
  hour?: number
  action?: 'craquage' | 'success' | 'correction'
}

const clamp = (value: number | undefined, fallback = 0, min = 0) =>
  Math.max(min, Number.isFinite(value ?? fallback) ? Number(value ?? fallback) : fallback)

export const coachRoast = ({
  habitName,
  type,
  streak,
  totalLogs,
  totalCraquages,
  hour,
  action,
}: CoachRoastInput): string => {
  const safeStreak = clamp(streak)
  const safeTotalLogs = clamp(totalLogs)
  const safeTotalCraquages = clamp(totalCraquages)
  const nowHour = typeof hour === 'number' ? hour : new Date().getHours()

  const dayLine = getRoastForDayContext(nowHour)
  const habitLine =
    type === 'bad'
      ? getRoastForBadHabit(habitName, safeStreak, safeTotalCraquages || safeTotalLogs)
      : getRoastForGoodHabit(habitName, safeStreak || (safeTotalLogs > 0 ? 1 : 0))

  const volumeLine =
    type === 'good'
      ? safeTotalLogs >= 5
        ? `Tu as déjà validé ${safeTotalLogs} fois récemment. Pas question de relâcher.`
        : safeTotalLogs === 0
        ? `Toujours aucun log sur ${habitName}. Commence aujourd'hui.`
        : `Seulement ${safeTotalLogs} validations. Accélère.`
      : safeTotalCraquages >= 5
      ? `Compteur rouge : ${safeTotalCraquages} craquages.`
      : safeTotalCraquages === 0
      ? `Aucun craquage sur ${habitName} récemment, garde ce sang-froid.`
      : `${safeTotalCraquages} craquage(s) déjà. Ça suffit.`

  const actionLine = action ? getRoastForAction(action) : getCoachPushLine()

  return [dayLine, habitLine, volumeLine, actionLine].filter(Boolean).join(' ')
}

const buildToastRoast = (
  action: 'craquage' | 'success' | 'correction',
  habitName: string,
  streak?: number,
  totalLogs?: number,
  totalCraquages?: number
) =>
  coachRoast({
    habitName,
    type: action === 'success' ? 'good' : 'bad',
    streak,
    totalLogs,
    totalCraquages,
    action,
  })

export const toastRoastSuccess = (habitName: string, streak?: number, totalLogs?: number) =>
  buildToastRoast('success', habitName, streak, totalLogs, 0)

export const toastRoastCraquage = (habitName: string, streak?: number, totalCraquages?: number) =>
  buildToastRoast('craquage', habitName, streak, 0, totalCraquages)

export const toastRoastCorrection = (habitName: string, streak?: number, totalCraquages?: number) => {
  const base = buildToastRoast('correction', habitName, streak, 0, totalCraquages)
  const extra = getAutoDerisionLine()
  return `${base} ${extra}`
}

export type { CoachRoastInput }
