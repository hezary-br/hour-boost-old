import type { EventParameters } from "~/infra/services"

const getGhostFunction = () => () => {}

export class LastHandler {
  private readonly lastHandler: Map<keyof EventParameters, Function> = new Map()
  private readonly manualHandlers: Map<keyof HandlersEventMapping, Function> = new Map()
  private readonly lastArguments: Map<keyof EventParameters, any[]> = new Map()

  getManualHandlerOrGhost = <K extends keyof HandlersEventMapping = keyof HandlersEventMapping>(
    eventName: K
  ) => {
    const manualHandler = this.manualHandlers.get(eventName)
    if (!manualHandler) {
      // console.log(
      //   `[ManualHandler]: Warning! Attempt to run ${eventName}, but there is no handler set for it.`
      // )
      return getGhostFunction()
    }
    return manualHandler as (...args: HandlersEventMapping[K]) => void
  }

  getLastHandler = <K extends keyof EventParameters = keyof EventParameters>(eventName: K) => {
    const lastHandler = this.lastHandler.get(eventName)
    if (!lastHandler) {
      // console.log(`[LastHandler]: Warning! Attempt to run ${eventName}, but there is no handler set for it.`)
      return getGhostFunction()
    }
    return lastHandler as (...args: EventParameters[K]) => void
  }

  setLastHandler = <K extends keyof EventParameters = keyof EventParameters>(
    eventName: K,
    callback: (...args: EventParameters[K]) => void
  ) => {
    this.lastHandler.set(eventName, callback)
  }

  setManualHandler = <K extends keyof HandlersEventMapping = keyof HandlersEventMapping>(
    eventName: K,
    callback: (...args: HandlersEventMapping[K]) => void
  ) => {
    this.manualHandlers.set(eventName, callback)
  }

  getLastArguments<K extends keyof EventParameters = keyof EventParameters>(eventName: K) {
    const lastArgs = this.lastArguments.get(eventName)
    if (!lastArgs) return null
    return lastArgs as EventParameters[K]
  }

  setLastArguments<K extends keyof EventParameters = keyof EventParameters>(
    eventName: K,
    args: EventParameters[K]
  ) {
    this.lastArguments.set(eventName, args)
  }

  listLastHandlers() {
    return this.lastHandler.entries()
  }
}

export type HandlersEventMapping = {
  steamGuard: [code: string]
}
