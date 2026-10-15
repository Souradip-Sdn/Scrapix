"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { LocationFields, LocationState } from "@/components/admin/location-fields";

export interface CustomerProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  org_type?: string;
  company_name?: string;
  gst_number?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
}

export function ProfileEditForm({ user }: { user: CustomerProfileData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);

  const [orgType, setOrgType] = useState(user.org_type || "private");
  const [companyName, setCompanyName] = useState(user.company_name || "");
  const [gstNumber, setGstNumber] = useState(user.gst_number || "");

  const [bankAccountNumber, setBankAccountNumber] = useState(user.bank_account_number || "");
  const [bankIfscCode, setBankIfscCode] = useState(user.bank_ifsc_code || "");
  const [bankName, setBankName] = useState(user.bank_name || "");

  const [location, setLocation] = useState<LocationState>({
    service_area: user.address,
    landmark: "",
    city: user.city,
    state: user.state,
    pincode: user.pincode,
    latitude: user.latitude ? String(user.latitude) : "",
    longitude: user.longitude ? String(user.longitude) : "",
  });

  const isOrganization = !!user.company_name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!location.latitude || !location.longitude) {
      setError("Please pin your exact location on the map.");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        name,
        phone,
        address: location.landmark 
            ? `${location.service_area}, ${location.landmark}` 
            : location.service_area,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        latitude: location.latitude,
        longitude: location.longitude,
        bankAccountNumber,
        bankIfscCode,
        bankName,
      };

      if (isOrganization) {
        payload.companyName = companyName;
        payload.orgType = orgType;
        payload.gstNumber = gstNumber;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save profile");
      } else {
        setSuccess("Profile updated successfully");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="form-grid">
        <div className="field full">
          <label htmlFor="pf-name">Full Name</label>
          <input
            id="pf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="field">
          <label htmlFor="pf-email">Email (Cannot be changed)</label>
          <input id="pf-email" value={user.email} disabled />
        </div>
        <div className="field">
          <label htmlFor="pf-phone">Phone Number</label>
          <input
            id="pf-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {isOrganization && (
          <>
            <div className="field full">
              <label htmlFor="pf-companyName">Organization Name</label>
              <input
                id="pf-companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="pf-orgType">Organization Type</label>
              <select
                id="pf-orgType"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
              >
                <option value="private">Private</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-gstNumber">GST Number</label>
              <input
                id="pf-gstNumber"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                required
              />
            </div>
          </>
        )}
      </div>

      <LocationFields
        idPrefix="pf-loc"
        value={location}
        onChange={setLocation}
      />

      <div className="glass card stack" style={{ gap: 16, marginTop: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Bank Details</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
            Add your bank account details to receive payments for sold items.
          </p>
        </div>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="pf-bankAccount">Account Number</label>
            <input
              id="pf-bankAccount"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="e.g. 123456789012"
            />
          </div>
          <div className="field">
            <label htmlFor="pf-bankIfsc">IFSC Code</label>
            <input
              id="pf-bankIfsc"
              value={bankIfscCode}
              onChange={(e) => setBankIfscCode(e.target.value)}
              placeholder="e.g. SBIN0001234"
            />
          </div>
          <div className="field">
            <label htmlFor="pf-bankName">Bank Name</label>
            <input
              id="pf-bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. State Bank of India"
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
