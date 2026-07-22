"use client";

import dynamic from "next/dynamic";

// This thin client wrapper exists solely so that `ssr: false` is used
// inside a Client Component — Next.js does not allow it in Server Components.
const PartnerLocationBeacon = dynamic(
  () =>
    import("@/components/tracking/partner-location-beacon").then(
      (m) => m.PartnerLocationBeacon,
    ),
  { ssr: false },
);

export function PartnerLocationBeaconWrapper(
  props: React.ComponentProps<typeof PartnerLocationBeacon>,
) {
  return <PartnerLocationBeacon {...props} />;
}
