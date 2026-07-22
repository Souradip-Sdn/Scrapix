"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Crosshair, LoaderCircle, MapPin } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const DEFAULT_LATITUDE = 23.8315;
const DEFAULT_LONGITUDE = 91.2868;
const DEFAULT_ZOOM = 16;

export interface LocationPickerMapProps {
  latitude: string;
  longitude: string;
  onPositionChange: (latitude: number, longitude: number) => void;
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(7));
}

interface MapControllerProps {
  latitude: number | null;
  longitude: number | null;
  onPositionChange: (latitude: number, longitude: number) => void;
  onMapReady: (map: LeafletMap | null) => void;
  onMovingChange: (moving: boolean) => void;
}

function MapController({
  latitude,
  longitude,
  onPositionChange,
  onMapReady,
  onMovingChange,
}: MapControllerProps) {
  const userMovedMap = useRef(false);

  const map = useMapEvents({
    click(event) {
      userMovedMap.current = true;
      onMovingChange(true);

      onPositionChange(
        roundCoordinate(event.latlng.lat),
        roundCoordinate(event.latlng.lng),
      );

      map.flyTo(event.latlng, Math.max(map.getZoom(), DEFAULT_ZOOM), {
        animate: true,
        duration: 0.35,
      });
    },
    dragstart() {
      userMovedMap.current = true;
      onMovingChange(true);
    },
    movestart() {
      if (userMovedMap.current) {
        onMovingChange(true);
      }
    },
    moveend() {
      if (!userMovedMap.current) return;

      const center = map.getCenter();

      onPositionChange(
        roundCoordinate(center.lat),
        roundCoordinate(center.lng),
      );

      onMovingChange(false);
      userMovedMap.current = false;
    },
  });

  useEffect(() => {
    onMapReady(map);

    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      onMapReady(null);
    };
  }, [map, onMapReady]);

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null ||
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return;
    }

    const center = map.getCenter();
    const isAlreadyCentered =
      Math.abs(center.lat - latitude) < 0.000001 &&
      Math.abs(center.lng - longitude) < 0.000001;

    if (!isAlreadyCentered) {
      map.setView([latitude, longitude], map.getZoom(), {
        animate: false,
      });
    }
  }, [latitude, longitude, map]);

  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onPositionChange,
}: LocationPickerMapProps) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  const selectedLatitude = isValidLatitude(parsedLatitude)
    ? parsedLatitude
    : null;
  const selectedLongitude = isValidLongitude(parsedLongitude)
    ? parsedLongitude
    : null;

  const initialCenter: [number, number] = [
    selectedLatitude ?? DEFAULT_LATITUDE,
    selectedLongitude ?? DEFAULT_LONGITUDE,
  ];

  const [map, setMap] = useState<LeafletMap | null>(null);
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleMapReady = useCallback((instance: LeafletMap | null) => {
    setMap(instance);
  }, []);

  const useCurrentLocation = useCallback(() => {
    setLocationError("");

    if (!("geolocation" in navigator)) {
      setLocationError("Location access is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = roundCoordinate(position.coords.latitude);
        const nextLongitude = roundCoordinate(position.coords.longitude);

        onPositionChange(nextLatitude, nextLongitude);
        map?.flyTo([nextLatitude, nextLongitude], 18, {
          animate: true,
          duration: 0.5,
        });

        setLocating(false);
      },
      (error) => {
        setLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Please allow browser location access.");
          return;
        }

        setLocationError("Unable to detect the current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  }, [map, onPositionChange]);

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: 390,
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background: "rgba(0, 0, 0, 0.16)",
        }}
      >
        <MapContainer
          center={initialCenter}
          zoom={DEFAULT_ZOOM}
          minZoom={3}
          maxZoom={19}
          scrollWheelZoom={false}
          doubleClickZoom
          dragging
          zoomControl
          style={{ width: "100%", height: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            latitude={selectedLatitude}
            longitude={selectedLongitude}
            onPositionChange={onPositionChange}
            onMapReady={handleMapReady}
            onMovingChange={setMoving}
          />
        </MapContainer>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            zIndex: 800,
            pointerEvents: "none",
            transform: moving
              ? "translate(-50%, calc(-100% - 10px)) scale(1.06)"
              : "translate(-50%, -100%) scale(1)",
            transition: "transform 160ms ease",
            filter: "drop-shadow(0 5px 7px rgba(0, 0, 0, 0.45))",
          }}
        >
          <MapPin
            size={46}
            strokeWidth={2.2}
            color="#ffffff"
            fill="#ef4444"
          />
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            zIndex: 790,
            width: moving ? 18 : 12,
            height: moving ? 7 : 5,
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.38)",
            transform: "translate(-50%, 3px)",
            transition: "all 160ms ease",
            pointerEvents: "none",
          }}
        />

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label="Use current location"
          title="Use current location"
          style={{
            position: "absolute",
            right: 12,
            bottom: 18,
            zIndex: 900,
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: 12,
            background: "#ffffff",
            color: "#111827",
            cursor: locating ? "wait" : "pointer",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.22)",
          }}
        >
          {locating ? (
            <LoaderCircle className="spin" size={20} />
          ) : (
            <Crosshair size={20} />
          )}
        </button>

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 16,
            zIndex: 850,
            transform: "translateX(-50%)",
            maxWidth: "calc(100% - 150px)",
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.88)",
            color: "#ffffff",
            fontSize: "0.76rem",
            fontWeight: 700,
            textAlign: "center",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.24)",
          }}
        >
          Drag map to place the pin exactly
        </div>
      </div>

      {locationError && (
        <small
          style={{
            display: "block",
            marginTop: 7,
            color: "var(--danger, #ef4444)",
            fontSize: "0.78rem",
          }}
        >
          {locationError}
        </small>
      )}
    </div>
  );
}
