"use client";

import { useEffect } from "react";

interface BackgroundLocationSharerProps {
  activePickupIds: number[];
}

const BROADCAST_INTERVAL_MS = 15000;

export function BackgroundLocationSharer({ activePickupIds }: BackgroundLocationSharerProps) {
  useEffect(() => {
    if (activePickupIds.length === 0) return;

    let intervalId: ReturnType<typeof setInterval>;

    async function sendLocation(lat: number, lng: number) {
      // Broadcast location to all active pickups
      const promises = activePickupIds.map((pickupId) =>
        fetch(`/api/tracking/${pickupId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        }).catch((err) => {
          console.error(`Failed to broadcast to pickup ${pickupId}:`, err);
        })
      );
      await Promise.all(promises);
    }

    if ("geolocation" in navigator) {
      const getAndSend = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            sendLocation(latitude, longitude);
          },
          (err) => {
            console.warn("Background location capture failed:", err);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      };

      // Trigger immediately and then on interval
      getAndSend();
      intervalId = setInterval(getAndSend, BROADCAST_INTERVAL_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activePickupIds]);

  return null; // Silent component
}
