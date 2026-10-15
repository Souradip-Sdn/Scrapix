"use client";
import { useState } from "react";
import {
  Eye, LoaderCircle, MailCheck, MessageSquare,
  Pencil, Plus, RefreshCw, Trash2, Truck,
} from "lucide-react";
import { RegisterPickupPartnerModal } from "@/components/admin/register-pickup-partner-modal";
import { ViewPickupPartnerModal } from "@/components/admin/view-pickup-partner-modal";
import { EditPickupPartnerModal } from "@/components/admin/edit-pickup-partner-modal";

export type PickupPartner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_area: string;
  vehicle_type: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  registered_by_name: string;
};

const vehicleLabel: Record<string, string> = {
  two_wheeler: "2-Wheeler",
  three_wheeler: "Auto / 3W",
  pickup_truck: "Pickup Truck",
  mini_truck: "Mini Truck",
  large_truck: "Large Truck",
};

type Modal = "create" | "view" | "edit" | "delete" | null;

export function PickupPartnersSection({ initialPartners }: { initialPartners: PickupPartner[] }) {
  const [partners, setPartners] = useState(initialPartners);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<PickupPartner | null>(null);

  // Per-row action states
  const [resending, setResending] = useState<number | null>(null);
  const [resendMsg, setResendMsg] = useState<{ id: number; msg: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function openModal(modal: Modal, partner?: PickupPartner) {
    setSelected(partner ?? null);
    setActiveModal(modal);
  }
  function closeModal() { setActiveModal(null); setSelected(null); }

  async function refreshPartners() {
    const res = await fetch("/api/admin/pickup-partners");
    if (res.ok) setPartners((await res.json()).partners);
  }

  async function resendOtp(partner: PickupPartner) {
    setResending(partner.id);
    setResendMsg(null);
    const res = await fetch(`/api/admin/pickup-partners/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resendOtp: true }),
    });
    const data = await res.json();
    setResending(null);
    setResendMsg({ id: partner.id, msg: res.ok ? "OTP resent!" : (data.error || "Failed") });
    setTimeout(() => setResendMsg(null), 4000);
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/pickup-partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  }

  async function deletePartner(id: number) {
    setDeleting(id);
    const res = await fetch(`/api/admin/pickup-partners/${id}`, { method: "DELETE" });
    setDeleting(null);
    setDeleteConfirm(null);
    if (res.ok) {
      setPartners((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <section className="glass card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Field Operations</span>
          <h3>Pickup partner agents</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
            Admin-registered field agents for doorstep e-waste collection.
          </p>
        </div>
        <button
          id="register-pickup-partner-btn"
          className="btn btn-primary"
          onClick={() => openModal("create")}
        >
          <Plus size={18} /> Register Agent
        </button>
      </div>

      {/* ── Create modal ──────────────────────────────────────────────── */}
      {activeModal === "create" && (
        <RegisterPickupPartnerModal
          onClose={closeModal}
          onSuccess={() => { closeModal(); refreshPartners(); }}
        />
      )}

      {/* ── View modal ───────────────────────────────────────────────── */}
      {activeModal === "view" && selected && (
        <ViewPickupPartnerModal
          partner={selected}
          onClose={closeModal}
          onEdit={() => setActiveModal("edit")}
        />
      )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {activeModal === "edit" && selected && (
        <EditPickupPartnerModal
          partner={selected}
          onClose={closeModal}
          onSuccess={(updated) => {
            setPartners((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setSelected(updated);
          }}
        />
      )}

      {/* ── Table / Empty state ──────────────────────────────────────── */}
      {partners.length === 0 ? (
        <div className="empty">
          <Truck size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No pickup agents registered yet.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal("create")}>
            Register first agent
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Contact</th>
                <th>Area / Vehicle</th>
                <th>Verified</th>
                <th>Status</th>
                <th style={{ minWidth: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td data-label="Agent">
                    <strong>{p.name}</strong>
                    {p.registered_by_name && (
                      <><br /><small className="muted">by {p.registered_by_name}</small></>
                    )}
                  </td>
                  <td data-label="Contact">
                    {p.email}
                    <br />
                    <small className="muted">{p.phone}</small>
                  </td>
                  <td data-label="Area / Vehicle">
                    {p.service_area}
                    <br />
                    <small className="muted">{vehicleLabel[p.vehicle_type] ?? p.vehicle_type}</small>
                  </td>
                  <td data-label="Verified">
                    {p.is_verified ? (
                      <span className="badge badge-approved" style={{ gap: 5 }}>
                        <MailCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ gap: 5 }}>
                        <MessageSquare size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td data-label="Status">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                      style={{ minWidth: 110, fontSize: "0.82rem", padding: "6px 10px" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td data-label="">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      {/* View + Edit */}
                      <div className="row" style={{ gap: 6 }}>
                        <button
                          id={`view-partner-btn-${p.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => openModal("view", p)}
                          title="View details"
                          style={{ gap: 5 }}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          id={`edit-partner-btn-${p.id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => openModal("edit", p)}
                          title="Edit partner"
                          style={{ gap: 5 }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      </div>

                      {/* Resend OTP (only if unverified) */}
                      {!p.is_verified && (
                        <div>
                          <button
                            id={`resend-otp-btn-${p.id}`}
                            className="btn btn-ghost btn-sm"
                            disabled={resending === p.id}
                            onClick={() => resendOtp(p)}
                            style={{ gap: 5, whiteSpace: "nowrap", width: "100%" }}
                          >
                            {resending === p.id
                              ? <LoaderCircle className="spin" size={13} />
                              : <RefreshCw size={13} />}
                            Resend OTP
                          </button>
                          {resendMsg?.id === p.id && (
                            <small style={{ color: "var(--primary)", fontSize: "0.76rem" }}>
                              {resendMsg.msg}
                            </small>
                          )}
                        </div>
                      )}

                      {/* Delete with inline confirmation */}
                      {deleteConfirm === p.id ? (
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <button
                            id={`confirm-delete-btn-${p.id}`}
                            className="btn btn-danger btn-sm"
                            disabled={deleting === p.id}
                            onClick={() => deletePartner(p.id)}
                            style={{ gap: 5, fontSize: "0.78rem" }}
                          >
                            {deleting === p.id ? <LoaderCircle className="spin" size={13} /> : null}
                            Confirm
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteConfirm(null)}
                            style={{ fontSize: "0.78rem" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-partner-btn-${p.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirm(p.id)}
                          style={{ gap: 5, color: "var(--danger)", borderColor: "rgba(255,142,133,0.3)" }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
