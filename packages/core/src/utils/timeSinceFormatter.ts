const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export function formatTimeSince(timeInMiliseconds: number) {
  const timeInSeconds = timeInMiliseconds / 1000

  // seconds
  if (isBetweenRange(timeInSeconds, 0, MINUTE)) {
    const seconds = floor(timeInSeconds)
    return `${seconds} segundo${hasS(seconds)}`
  }
  // minutes
  if (isBetweenRange(timeInSeconds, MINUTE, HOUR)) {
    const minutes = floor(timeInSeconds / MINUTE)
    const seconds = floor(timeInSeconds % MINUTE)
    const secondsString = parseInt(seconds) > 0 ? ` e ${seconds} segundo${hasS(seconds)}` : ""
    return `${minutes} minuto${hasS(minutes)}${secondsString}`
  }
  // hours
  if (isBetweenRange(timeInSeconds, HOUR, DAY)) {
    const hours = floor(timeInSeconds / HOUR)
    const minutes = floor((timeInSeconds % HOUR) / MINUTE)
    const minutesString = parseInt(minutes) > 0 ? ` e ${minutes} minuto${hasS(minutes)}` : ""
    return `${hours} hora${hasS(hours)}${minutesString}`
  }
  // days
  if (isBetweenRange(timeInSeconds, DAY, WEEK)) {
    const days = floor(timeInSeconds / DAY)
    const hours = floor((timeInSeconds % DAY) / HOUR)
    const hoursString = parseInt(hours) > 0 ? ` e ${hours} hora${hasS(hours)}` : ""
    return `${days} dia${hasS(days)}${hoursString}`
  }
  // weeks
  if (isBetweenRange(timeInSeconds, WEEK, MONTH)) {
    const weeks = floor(timeInSeconds / WEEK)
    const days = floor((timeInSeconds % WEEK) / DAY)
    const daysString = parseInt(days) > 0 ? ` e ${days} dia${hasS(days)}` : ""
    return `${weeks} semana${hasS(weeks)}${daysString}`
  }
  // months
  if (isBetweenRange(timeInSeconds, MONTH, YEAR)) {
    const months = floor(timeInSeconds / MONTH)
    const weeks = floor((timeInSeconds % MONTH) / WEEK)
    const weeksString = parseInt(weeks) > 0 ? ` e ${weeks} semana${hasS(weeks)}` : ""
    return `${months} ${hasMeses(months)}${weeksString}`
  }
  return `${timeInSeconds} segundos`
}

export function formatTimeSinceShort(timeInMiliseconds: number) {
  const timeInSeconds = timeInMiliseconds / 1000

  // seconds
  if (isBetweenRange(timeInSeconds, 0, MINUTE)) {
    const seconds = floor(timeInSeconds)
    return `${seconds} seg`
  }
  // minutes
  if (isBetweenRange(timeInSeconds, MINUTE, HOUR)) {
    const minutes = floor(timeInSeconds / MINUTE)
    const seconds = floor(timeInSeconds % MINUTE)
    const secondsString = parseInt(seconds) > 0 ? ` e ${seconds} seg` : ""
    return `${minutes} min${secondsString}`
  }
  // hours
  if (isBetweenRange(timeInSeconds, HOUR, DAY)) {
    const hours = floor(timeInSeconds / HOUR)
    const minutes = floor((timeInSeconds % HOUR) / MINUTE)
    const minutesString = parseInt(minutes) > 0 ? ` e ${minutes} min` : ""
    return `${hours} hora${hasS(hours)}${minutesString}`
  }
  // days
  if (isBetweenRange(timeInSeconds, DAY, WEEK)) {
    const days = floor(timeInSeconds / DAY)
    const hours = floor((timeInSeconds % DAY) / HOUR)
    const hoursString = parseInt(hours) > 0 ? ` e ${hours} hora${hasS(hours)}` : ""
    return `${days} dia${hasS(days)}${hoursString}`
  }
  // weeks
  if (isBetweenRange(timeInSeconds, WEEK, MONTH)) {
    const weeks = floor(timeInSeconds / WEEK)
    const days = floor((timeInSeconds % WEEK) / DAY)
    const daysString = parseInt(days) > 0 ? ` e ${days} dia${hasS(days)}` : ""
    return `${weeks} semana${hasS(weeks)}${daysString}`
  }
  // months
  if (isBetweenRange(timeInSeconds, MONTH, YEAR)) {
    const months = floor(timeInSeconds / MONTH)
    const weeks = floor((timeInSeconds % MONTH) / WEEK)
    const weeksString = parseInt(weeks) > 0 ? ` e ${weeks} semana${hasS(weeks)}` : ""
    return `${months} ${hasMeses(months)}${weeksString}`
  }
  return `${timeInSeconds} seg`
}

const floor = (value: number) => Number(Math.floor(value)).toFixed(0)
const hasS = (value: string) => (value != "1" ? "s" : "")
const hasMeses = (value: string) => (value != "1" ? "meses" : "mês")
const isBetweenRange = (value: number, min: number, max: number) => value >= min && value < max
