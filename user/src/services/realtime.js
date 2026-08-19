import { io } from 'socket.io-client'
import { SOCKET_URL, getToken } from './api'

export function connectNotifications(onNotification) {
  const token = getToken()
  if (!token) return () => {}
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  socket.on('notification:new', onNotification)
  return () => {
    socket.off('notification:new', onNotification)
    socket.disconnect()
  }
}
