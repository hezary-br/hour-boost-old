type ArgsTuple = any[]
type CallbackResolver = (...args: any[]) => void
export type EventsTuple = Record<string, ArgsTuple>
type EventHandler<T extends ArgsTuple> = (...args: T) => void
type EventHandlers<T extends ArgsTuple> = EventHandler<T>[]
type HandlersMapping<Events extends EventsTuple> = {
  [K in keyof Events]: EventHandlers<Events[K]>
}
type ResolversMapping<Events extends EventsTuple> = {
  [K in keyof Events]: CallbackResolver
}

type GlobalEvents = {
  account_logged_in: [userId: string, accountName: string, wasRequiring: boolean]
  account_required_steam_guard: [userId: string, accountName: string]
}

export class Events {
  private static handlers: Partial<HandlersMapping<GlobalEvents>> = {}
  private static resolvers: Partial<ResolversMapping<GlobalEvents>> = {}

  static on<TEventName extends keyof GlobalEvents>(
    event: TEventName,
    handler: EventHandler<GlobalEvents[TEventName]>
  ) {
    const eventHandlers = this.handlers[event] as EventHandlers<GlobalEvents[TEventName]>
    if (!eventHandlers) {
      this.handlers[event] = []
      this.handlers[event]?.push(handler)
      return
    }
    eventHandlers.push(handler)
  }

  static once<TEventName extends keyof GlobalEvents>(
    event: TEventName,
    handler: EventHandler<GlobalEvents[TEventName]>
  ) {
    const handlerTemp = (...args: GlobalEvents[TEventName]) => {
      handler(...args)
      this.off(event, handlerTemp)
    }
    this.on(event, handlerTemp)
  }

  static off<TEventName extends keyof GlobalEvents>(
    event: TEventName,
    handler: EventHandler<GlobalEvents[TEventName]>
  ) {
    const eventHandlers = this.handlers[event] as EventHandlers<GlobalEvents[TEventName]>
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler)
      if (index < 0) return
      eventHandlers.splice(index, 1)
    }
  }

  static emit<TEventName extends keyof GlobalEvents>(event: TEventName, ...args: GlobalEvents[TEventName]) {
    const eventHandlers = this.handlers[event]
    if (!eventHandlers) return
    const { asyncHandlers, handlers } = getAsyncFunction(eventHandlers)
    for (const handler of handlers) {
      handler(...args)
    }
    const promises = asyncHandlers.map(asyncHandler => asyncHandler(...args))
    Promise.all(promises).finally(() => {
      const resolver = this.resolvers[event]
      if (!resolver) return
      resolver()
    })
  }

  static async emitAsync<TEventName extends keyof GlobalEvents>(
    event: TEventName,
    ...args: GlobalEvents[TEventName]
  ): Promise<void> {
    const eventHandlers = this.handlers[event]
    if (!eventHandlers) return
    const { asyncHandlers, handlers } = getAsyncFunction(eventHandlers)
    for (const handler of handlers) {
      handler(...args)
    }
    const promises = asyncHandlers.map(asyncHandler => asyncHandler(...args))
    await Promise.all(promises)
  }

  static setEventResolver<TEventName extends keyof GlobalEvents>(
    event: TEventName,
    callback: CallbackResolver
  ) {
    this.resolvers[event] = callback
  }

  static listAllListeners() {
    return this.handlers
  }

  static listAllEventsWithListeners() {
    return Object.keys(this.handlers).length
  }

  static listEventListeners<TEventName extends keyof GlobalEvents>(eventName: TEventName) {
    return this.handlers[eventName]
  }

  static listEventListenersAmount<TEventName extends keyof GlobalEvents>(eventName: TEventName) {
    return this.handlers[eventName]?.length
  }

  static listAllResolvers() {
    return this.resolvers
  }
}

type AsyncFunction = (...args: any[]) => Promise<any>
type RegularFunction = (...args: any[]) => any

export function getAsyncFunction(functions: Function[]) {
  const asyncHandlers: AsyncFunction[] = []
  const handlers: RegularFunction[] = []
  for (const fn of functions) {
    if (fn.constructor.name === "AsyncFunction") asyncHandlers.push(fn as AsyncFunction)
    else handlers.push(fn as RegularFunction)
  }
  return {
    asyncHandlers,
    handlers,
  }
}
