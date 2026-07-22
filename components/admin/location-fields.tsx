"use client";

import dynamic from "next/dynamic";
import type { LocationPickerMapProps } from "./location-picker-map";

const LocationPickerMap = dynamic<LocationPickerMapProps>(
  () =>
    import("./location-picker-map").then(
      (module) => module.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 390,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.16)",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        Loading map...
      </div>
    ),
  },
);

export interface LocationState {
  service_area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
}

interface PartnerLocationSource {
  service_area?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export function emptyLocation(): LocationState {
  return {
    service_area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  };
}

export function partnerToLocation(
  partner: PartnerLocationSource,
): LocationState {
  return {
    service_area: partner.service_area ?? "",
    landmark: partner.landmark ?? "",
    city: partner.city ?? "",
    state: partner.state ?? "",
    pincode: partner.pincode ?? "",
    latitude:
      partner.latitude === null ||
        partner.latitude === undefined
        ? ""
        : String(partner.latitude),
    longitude:
      partner.longitude === null ||
        partner.longitude === undefined
        ? ""
        : String(partner.longitude),
  };
}

interface LocationFieldsProps {
  idPrefix: string;
  value: LocationState;
  onChange: (value: LocationState) => void;
}

export function LocationFields({
  idPrefix,
  value,
  onChange,
}: LocationFieldsProps) {
  function update<K extends keyof LocationState>(
    field: K,
    nextValue: LocationState[K],
  ) {
    onChange({
      ...value,
      [field]: nextValue,
    });
  }

  function updateCoordinates(
    latitude: number,
    longitude: number,
  ) {
    onChange({
      ...value,
      latitude: latitude.toFixed(7),
      longitude: longitude.toFixed(7),
    });
  }

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);

  const hasCoordinates =
    value.latitude.trim() !== "" &&
    value.longitude.trim() !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return (
    <section className="stack" style={{ gap: 16 }}>
      <div>
        <span className="eyebrow">Pickup Location</span>

        <h4
          style={{
            marginTop: 5,
            marginBottom: 4,
          }}
        >
          Address and exact map location
        </h4>

        <p
          className="muted"
          style={{
            margin: 0,
            fontSize: "0.82rem",
          }}
        >
          Enter the address and move the map beneath the pointer
          to select the exact pickup location.
        </p>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label htmlFor={`${idPrefix}-service-area`}>
            Service Area / Full Address{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </label>

          <textarea
            id={`${idPrefix}-service-area`}
            value={value.service_area}
            onChange={(event) =>
              update("service_area", event.target.value)
            }
            required
            minLength={3}
            rows={3}
            placeholder="House number, road, locality, village or ward"
            style={{
              resize: "vertical",
              minHeight: 88,
            }}
          />
        </div>

        <div className="field full">
          <label htmlFor={`${idPrefix}-landmark`}>
            Landmark
          </label>

          <input
            id={`${idPrefix}-landmark`}
            value={value.landmark}
            onChange={(event) =>
              update("landmark", event.target.value)
            }
            placeholder="Near market, school, hospital, etc."
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-city`}>
            City / Town{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </label>

          <input
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(event) =>
              update("city", event.target.value)
            }
            required
            placeholder="Agartala"
            autoComplete="address-level2"
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-state`}>
            State{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </label>

          <input
            id={`${idPrefix}-state`}
            value={value.state}
            onChange={(event) =>
              update("state", event.target.value)
            }
            required
            placeholder="Tripura"
            autoComplete="address-level1"
          />
        </div>

        <div className="field full">
          <label htmlFor={`${idPrefix}-pincode`}>
            PIN Code{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </label>

          <input
            id={`${idPrefix}-pincode`}
            value={value.pincode}
            onChange={(event) =>
              update(
                "pincode",
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6),
              )
            }
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
            inputMode="numeric"
            placeholder="799001"
            autoComplete="postal-code"
          />
        </div>
      </div>

      <div className="field">
        <label>
          Pin Exact Location{" "}
          <span style={{ color: "var(--danger)" }}>*</span>
        </label>

        <div style={{ marginTop: 8 }}>
          <LocationPickerMap
            latitude={value.latitude}
            longitude={value.longitude}
            onPositionChange={updateCoordinates}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${idPrefix}-latitude`}>
            Latitude
          </label>

          <input
            id={`${idPrefix}-latitude`}
            value={value.latitude}
            readOnly
            aria-readonly="true"
            placeholder="Select from map"
            tabIndex={-1}
            style={{
              cursor: "not-allowed",
              opacity: 0.82,
              background: "rgba(0,0,0,0.18)",
            }}
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-longitude`}>
            Longitude
          </label>

          <input
            id={`${idPrefix}-longitude`}
            value={value.longitude}
            readOnly
            aria-readonly="true"
            placeholder="Select from map"
            tabIndex={-1}
            style={{
              cursor: "not-allowed",
              opacity: 0.82,
              background: "rgba(0,0,0,0.18)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: hasCoordinates
            ? "1px solid rgba(34,197,94,0.35)"
            : "1px solid rgba(245,158,11,0.35)",
          background: hasCoordinates
            ? "rgba(34,197,94,0.09)"
            : "rgba(245,158,11,0.09)",
          fontSize: "0.8rem",
          color: "var(--text)",
        }}
      >
        {hasCoordinates
          ? "Exact location selected. Latitude and longitude are locked."
          : "Move or click the map to select the exact pickup location."}
      </div>
    </section>
  );
}