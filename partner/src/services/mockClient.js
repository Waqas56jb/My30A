export const setLatency = () => {}
export const setFailureMode = () => {}
export const subscribe = () => () => {}
export const publish = () => {}
export const clone = (value) => JSON.parse(JSON.stringify(value))
export const notFound = (label) => Object.assign(new Error(`We could not find ${label}.`), { code: 'NOT_FOUND' })
export const request = async (factory) => (typeof factory === 'function' ? factory() : factory)
