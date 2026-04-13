'use client'

// ─────────────────────────────────────────────────────────────────
// components/vereine/VereinMap.tsx
//
// Google Maps mit @vis.gl/react-google-maps
// Graceful fallback wenn kein API-Key konfiguriert.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps'
import type { VereinListItem, SportFilter } from '@/lib/types/verein'

// ── Sport-Farben für Marker ──────────────────────────────────────

const SPORT_MARKER_COLORS: Record<string, string> = {
  fussball: '#16A34A',
  tennis: '#C2621A',
  basketball: '#EA580C',
}

function getMarkerColor(slug: string): string {
  return SPORT_MARKER_COLORS[slug] ?? '#52525B'
}

// ── Custom SVG Marker ────────────────────────────────────────────

interface SportMarkerProps {
  verein: VereinListItem
  isSelected: boolean
  onClick: () => void
}

function SportMarker({ verein, isSelected, onClick }: SportMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()
  const color = getMarkerColor(verein.sport.slug)

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: verein.latitude!, lng: verein.longitude! }}
      onClick={onClick}
      zIndex={isSelected ? 10 : 1}
    >
      <svg
        width={isSelected ? 36 : 28}
        height={isSelected ? 44 : 36}
        viewBox="0 0 28 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: isSelected ? `drop-shadow(0 2px 8px ${color}88)` : undefined }}
      >
        <path
          d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.27 21.73 0 14 0Z"
          fill={color}
        />
        <circle cx="14" cy="14" r="6" fill="white" opacity="0.9" />
      </svg>
    </AdvancedMarker>
  )
}

// ── User-Standort Marker ─────────────────────────────────────────

function UserLocationMarker({ lat, lng }: { lat: number; lng: number }) {
  return (
    <AdvancedMarker position={{ lat, lng }} zIndex={20}>
      <div className="relative flex items-center justify-center">
        {/* Ripple-Animation */}
        <div
          className="absolute rounded-full bg-blue-400 opacity-30 animate-ping"
          style={{ width: 28, height: 28 }}
        />
        <div
          className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"
          style={{ zIndex: 1 }}
        />
      </div>
    </AdvancedMarker>
  )
}

// ── InfoWindow Inhalt ────────────────────────────────────────────

interface InfoWindowContentProps {
  verein: VereinListItem
  onClose: () => void
}

function InfoWindowContent({ verein, onClose }: InfoWindowContentProps) {
  const color = getMarkerColor(verein.sport.slug)
  const distanceLabel =
    verein.distanceKm !== null
      ? verein.distanceKm < 1
        ? '< 1 km'
        : `${verein.distanceKm.toFixed(1)} km`
      : null

  return (
    <div style={{ minWidth: 180, maxWidth: 240 }}>
      <div className="flex items-start gap-2 p-1">
        {/* Farbpunkt */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0A0A0A] leading-tight">{verein.name}</p>
          <p className="text-xs text-[#71717A] mt-0.5">
            {verein.city}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
          </p>
          {verein.monthlyFee !== null && verein.monthlyFee > 0 && (
            <p className="text-xs text-[#52525B] mt-1">{verein.monthlyFee.toFixed(0)} €/Monat</p>
          )}
          {(verein.monthlyFee === null || verein.monthlyFee === 0) && (
            <p className="text-xs text-[#16A34A] mt-1 font-medium">Kostenlos</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Fallback wenn kein API-Key ────────────────────────────────────

function MapFallback({ vereinCount }: { vereinCount: number }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F4F4F5] text-center px-6">
      <MapPin size={36} className="text-[#A1A1AA] mb-3" />
      <p className="text-sm font-medium text-[#52525B]">Karte nicht verfügbar</p>
      <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
        Google Maps API-Schlüssel nicht konfiguriert.
        {vereinCount > 0 && ` ${vereinCount} Vereine in der Liste gefunden.`}
      </p>
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────

interface VereinMapProps {
  vereine: VereinListItem[]
  selectedVerein: VereinListItem | null
  onSelectVerein: (verein: VereinListItem | null) => void
  userLat: number | null
  userLon: number | null
  sportFilter: SportFilter
}

export function VereinMap({
  vereine,
  selectedVerein,
  onSelectVerein,
  userLat,
  userLon,
}: VereinMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''
  const [infoWindowVerein, setInfoWindowVerein] = useState<VereinListItem | null>(null)

  const handleMarkerClick = useCallback(
    (verein: VereinListItem) => {
      setInfoWindowVerein(verein)
      onSelectVerein(verein)
    },
    [onSelectVerein],
  )

  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowVerein(null)
  }, [])

  if (!apiKey) {
    return <MapFallback vereinCount={vereine.length} />
  }

  // Karten-Zentrum: User-Standort oder Frankfurt (Hessen-Default)
  const center =
    userLat !== null && userLon !== null
      ? { lat: userLat, lng: userLon }
      : { lat: 50.1109, lng: 8.6821 }

  // Sichtbare Vereine (haben Koordinaten)
  const mappableVereine = vereine.filter(
    (v) => v.latitude !== null && v.longitude !== null,
  )

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={userLat !== null ? 11 : 10}
        mapId="sportrise-vereine-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* User-Standort */}
        {userLat !== null && userLon !== null && (
          <UserLocationMarker lat={userLat} lng={userLon} />
        )}

        {/* Verein-Marker */}
        {mappableVereine.map((v) => (
          <SportMarker
            key={v.id}
            verein={v}
            isSelected={selectedVerein?.id === v.id}
            onClick={() => handleMarkerClick(v)}
          />
        ))}

        {/* InfoWindow */}
        {infoWindowVerein &&
          infoWindowVerein.latitude !== null &&
          infoWindowVerein.longitude !== null && (
            <InfoWindow
              position={{
                lat: infoWindowVerein.latitude,
                lng: infoWindowVerein.longitude,
              }}
              onCloseClick={handleInfoWindowClose}
              pixelOffset={[0, -36]}
            >
              <InfoWindowContent
                verein={infoWindowVerein}
                onClose={handleInfoWindowClose}
              />
            </InfoWindow>
          )}
      </Map>
    </APIProvider>
  )
}
