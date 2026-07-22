"use client";

import dynamic from "next/dynamic";

const PartnerTrackingMap = dynamic(
  () =>
    import("@/components/tracking/partner-tracking-map").then(
      (m) => m.PartnerTrackingMap,
    ),
  { ssr: false, loading: () => <div className="map-loading-skeleton" /> },
);

export function PartnerTrackingMapWrapper(
  props: React.ComponentProps<typeof PartnerTrackingMap>,
) {
  return <PartnerTrackingMap {...props} />;
}
