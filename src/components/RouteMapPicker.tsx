'use client'

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import { MapPin, Trash2, Navigation, Maximize2, X } from 'lucide-react'

export interface Waypoint {
  lat: number
  lng: number
  name: string
}

interface RouteMapPickerProps {
  waypoints: Waypoint[]
  onChange: (waypoints: Waypoint[], distance: number) => void
  readOnly?: boolean
}

const smallMapContainerStyle = {
  width: '100%',
  height: '200px',
}

const fullScreenMapContainerStyle = {
  width: '100%',
  height: '100%',
}

// Default center: ASM Public School location
const defaultCenter = {
  lat: 29.749333571736575,
  lng: 73.71368687580983,
}

// Calculate distance between two points using Haversine formula
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate total distance for all waypoints
function calculateTotalDistance(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 0
  let total = 0
  for (let i = 1; i < waypoints.length; i++) {
    total += calculateHaversineDistance(
      waypoints[i - 1].lat,
      waypoints[i - 1].lng,
      waypoints[i].lat,
      waypoints[i].lng
    )
  }
  return Math.round(total * 10) / 10 // Round to 1 decimal place
}

export default function RouteMapPicker({ waypoints, onChange, readOnly = false }: RouteMapPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [fullScreenMap, setFullScreenMap] = useState<google.maps.Map | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const onFullScreenLoad = useCallback((map: google.maps.Map) => {
    setFullScreenMap(map)
  }, [])

  const onFullScreenUnmount = useCallback(() => {
    setFullScreenMap(null)
  }, [])

  // Handle map click to add waypoint
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (readOnly) return
    if (!event.latLng) return

    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    const newWaypoint: Waypoint = {
      lat,
      lng,
      name: `Stop ${waypoints.length + 1}`,
    }

    const newWaypoints = [...waypoints, newWaypoint]
    const distance = calculateTotalDistance(newWaypoints)
    onChange(newWaypoints, distance)
  }, [waypoints, onChange, readOnly])

  // Handle marker drag
  const handleMarkerDrag = useCallback((index: number, event: google.maps.MapMouseEvent) => {
    if (readOnly) return
    if (!event.latLng) return

    const newWaypoints = [...waypoints]
    newWaypoints[index] = {
      ...newWaypoints[index],
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    }

    const distance = calculateTotalDistance(newWaypoints)
    onChange(newWaypoints, distance)
  }, [waypoints, onChange, readOnly])

  // Handle waypoint removal
  const handleRemoveWaypoint = useCallback((index: number) => {
    if (readOnly) return
    const newWaypoints = waypoints.filter((_, i) => i !== index)
    // Rename remaining waypoints
    const renamedWaypoints = newWaypoints.map((wp, i) => ({
      ...wp,
      name: `Stop ${i + 1}`,
    }))
    const distance = calculateTotalDistance(renamedWaypoints)
    onChange(renamedWaypoints, distance)
  }, [waypoints, onChange, readOnly])

  // Center map on waypoints when they change
  useEffect(() => {
    if (map && waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      waypoints.forEach(wp => bounds.extend({ lat: wp.lat, lng: wp.lng }))
      map.fitBounds(bounds, 50)
    }
  }, [map, waypoints])

  // Center fullscreen map on waypoints when they change
  useEffect(() => {
    if (fullScreenMap && waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      waypoints.forEach(wp => bounds.extend({ lat: wp.lat, lng: wp.lng }))
      fullScreenMap.fitBounds(bounds, 100)
    }
  }, [fullScreenMap, waypoints])

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false)
    }
    if (isFullScreen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isFullScreen])

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">Failed to load Google Maps</p>
        <p className="text-red-500 text-xs mt-1">Please check your API key configuration</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Loading map...</p>
        </div>
      </div>
    )
  }

  const totalDistance = calculateTotalDistance(waypoints)

  // Render map component (used in both small and fullscreen)
  const renderMap = (containerStyle: React.CSSProperties, mapRef: google.maps.Map | null, onLoadFn: (map: google.maps.Map) => void, onUnmountFn: () => void) => (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={waypoints.length > 0 ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : defaultCenter}
      zoom={waypoints.length > 0 ? 12 : 10}
      onClick={handleMapClick}
      onLoad={onLoadFn}
      onUnmount={onUnmountFn}
      options={{
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false,
      }}
    >
      {/* Markers */}
      {waypoints.map((waypoint, index) => (
        <Marker
          key={index}
          position={{ lat: waypoint.lat, lng: waypoint.lng }}
          label={{
            text: String(index + 1),
            color: 'white',
            fontWeight: 'bold',
          }}
          draggable={!readOnly}
          onDragEnd={(e) => handleMarkerDrag(index, e)}
        />
      ))}

      {/* Polyline connecting waypoints */}
      {waypoints.length > 1 && (
        <Polyline
          path={waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }))}
          options={{
            strokeColor: '#4F46E5',
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }}
        />
      )}
    </GoogleMap>
  )

  return (
    <div className="space-y-2">
      {/* Small Map with Expand Button */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        {renderMap(smallMapContainerStyle, map, onLoad, onUnmount)}

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setIsFullScreen(true)}
          className="absolute top-2 right-2 bg-white shadow-md rounded-lg p-2 hover:bg-gray-100 transition-colors z-10"
          title="Open larger map"
        >
          <Maximize2 className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Instructions */}
      {!readOnly && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Click on map to add stops. Drag markers to adjust. Click trash to remove.
        </p>
      )}

      {/* Waypoints list */}
      {waypoints.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Route Stops ({waypoints.length})</span>
            <span className="text-sm font-medium text-primary-600 flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              {totalDistance} km
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {waypoints.map((waypoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWaypoint(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state */
        !readOnly && (
          <div className="text-center py-3 bg-gray-50 rounded-lg">
            <MapPin className="h-6 w-6 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-1">No stops added yet</p>
            <p className="text-xs text-gray-400">Click on the map to add route stops</p>
          </div>
        )
      )}

      {/* Full Screen Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                <p className="text-sm text-gray-500">
                  Click on map to add stops • Drag markers to adjust • {waypoints.length} stops • {totalDistance} km total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 flex">
              {/* Large Map */}
              <div className="flex-1">
                {renderMap(fullScreenMapContainerStyle, fullScreenMap, onFullScreenLoad, onFullScreenUnmount)}
              </div>

              {/* Sidebar with waypoints */}
              <div className="w-72 border-l bg-gray-50 p-4 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">Route Stops</h4>
                {waypoints.length > 0 ? (
                  <div className="space-y-2">
                    {waypoints.map((waypoint, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Stop {index + 1}</p>
                            <p className="text-xs text-gray-500">
                              {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
                            </p>
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWaypoint(index)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Distance summary */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Distance:</span>
                        <span className="font-semibold text-primary-600">{totalDistance} km</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">No stops added</p>
                    <p className="text-xs text-gray-400 mt-1">Click on the map to add route stops</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
