import { useEffect, useState } from 'react'

/** Watch the device GPS. No-ops in browsers that block geolocation (including tests). */
export function useLiveLocation() {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation?.watchPosition) {
      setStatus('unsupported')
      return undefined
    }

    setStatus('locating')
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setStatus('live')
      },
      () => {
        setStatus('denied')
      },
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { coords, status }
}
