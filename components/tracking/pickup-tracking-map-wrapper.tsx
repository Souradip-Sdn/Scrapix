"use client";

import dynamic from "next/dynamic";

const PickupTrackingMap = dynamic(
  () =>
    import("@/components/tracking/pickup-tracking-map").then(
      (m) => m.PickupTrackingMap,
    ),
  { ssr: false, loading: () => <div className="map-loading-skeleton" /> },
);

export function PickupTrackingMapWrapper(
  props: React.ComponentProps<typeof PickupTrackingMap>,
) {
  return <PickupTrackingMap {...props} />;
}
