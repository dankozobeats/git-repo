export type HabitType = 'good' | 'bad'

export const isSuccess = (habitType: HabitType, count: number) =>
  habitType === 'good' ? count > 0 : count === 0

export const getBinaryStatusLabel = (habitType: HabitType, count: number) => {
  if (habitType === 'good') {
    return count > 0 ? 'Validée' : 'À faire'
  }
  return count > 0 ? 'Craquage' : 'Aucun craquage'
}
