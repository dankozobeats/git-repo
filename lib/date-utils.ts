const CLIENT_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? 'Europe/Paris'
const SERVER_TIMEZONE = process.env.APP_TIMEZONE ?? CLIENT_TIMEZONE

export const DEFAULT_TIMEZONE =
  typeof window === 'undefined' ? SERVER_TIMEZONE : CLIENT_TIMEZONE

type DateParts = { year: string; month: string; day: string }

const extractParts = (date: Date, timeZone: string): DateParts => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const find = (type: string) => parts.find(p => p.type === type)?.value ?? '00'

  return {
    year: find('year'),
    month: find('month'),
    day: find('day'),
  }
}

export const getTodayDateISO = (timeZone: string = DEFAULT_TIMEZONE) => {
  const { year, month, day } = extractParts(new Date(), timeZone)
  return `${year}-${month}-${day}`
}

export const toUtcDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(part => Number(part))
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
}

export const isFutureDate = (
  isoDate: string,
  timeZone: string = DEFAULT_TIMEZONE
) => {
  const today = toUtcDate(getTodayDateISO(timeZone))
  const target = toUtcDate(isoDate)
  return target.getTime() > today.getTime()
}

export const isSameDay = (a: string, b: string) =>
  toUtcDate(a).getTime() === toUtcDate(b).getTime()

export const clampToToday = (
  isoDate: string,
  timeZone: string = DEFAULT_TIMEZONE
) => {
  const today = getTodayDateISO(timeZone)
  return isFutureDate(isoDate, timeZone) ? today : isoDate
}
