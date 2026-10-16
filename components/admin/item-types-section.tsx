"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  CheckCircle2,
  DollarSign,
  Filter,
  Leaf,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ItemTypeModal, MaterialItem } from "@/components/admin/item-type-modal";

interface Props {
  initialMaterials: MaterialItem[];
}

export function ItemTypesSection({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeModal, setActiveModal] = useState<"create" | "edit" | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline toggling state
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showNotification(type: "success" | "error", text: string) {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  }

  // Refresh items from API
  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
        showNotification("success", "Item catalog refreshed.");
      } else {
        showNotification("error", "Failed to refresh items.");
      }
    } catch {
      showNotification("error", "Network error refreshing items.");
    } finally {
      setRefreshing(false);
    }
  }

  // Quick toggle active state
  async function toggleActive(item: MaterialItem) {
    setTogglingId(item.id);
    const targetState = item.active === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/materials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleActive: targetState === 1 }),
      });
      const data = await res.json();
      if (res.ok && data.material) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, active: targetState } : m))
        );
        showNotification(
          "success",
          `"${item.name}" is now ${targetState === 1 ? "active" : "inactive"}.`
        );
      } else {
        showNotification("error", data.error || "Failed to update status.");
      }
    } catch {
      showNotification("error", "Network error updating status.");
    } finally {
      setTogglingId(null);
    }
  }

  // Delete / Archive item
  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/materials/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setIsDeleting(false);

      if (res.ok) {
        if (data.deleted) {
          setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
          showNotification("success", data.message || `Deleted "${deleteTarget.name}".`);
        } else if (data.archived) {
          setMaterials((prev) =>
            prev.map((m) => (m.id === deleteTarget.id ? { ...m, active: 0 } : m))
          );
          showNotification("success", data.message || `Archived "${deleteTarget.name}".`);
        }
        setDeleteTarget(null);
      } else {
        showNotification("error", data.error || "Failed to delete item.");
      }
    } catch {
      setIsDeleting(false);
      showNotification("error", "Network error deleting item.");
    }
  }

  // Distinct categories
  const categories = useMemo(() => {
    return Array.from(new Set(materials.map((m) => m.category))).sort();
  }, [materials]);

  // Filtered list
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || m.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && m.active === 1) ||
        (statusFilter === "inactive" && m.active === 0);
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [materials, search, categoryFilter, statusFilter]);

  const totalCount = materials.length;
  const activeCount = materials.filter((m) => m.active === 1).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <section className="glass card" style={{ position: "relative" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          className={notification.type === "success" ? "success-box" : "error-box"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 99999,
            boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section Head */}
      <div className="section-head" style={{ flexWrap: "wrap", gap: 16 }}>
        <div>
          <span className="eyebrow">Catalog & Telemetry</span>
          <h3 style={{ margin: "2px 0 4px" }}>Item types & scrap rates</h3>
          <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
            Manage e-waste materials, pricing rates per kg, and verified CO₂ emission savings factors.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
            title="Refresh item types"
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMaterial(null);
              setActiveModal("create");
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add Item Type
          </button>
        </div>
      </div>

      {/* Metric summary pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          className="card soft"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Boxes size={18} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{totalCount}</div>
            <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>Total Items</div>
          </div>
        </div>

        <div
          className="card soft"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <CheckCircle2 size={18} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>{activeCount}</div>
            <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>Active in Catalog</div>
          </div>
        </div>

        <div
          className="card soft"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Archive size={18} color="var(--muted)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{inactiveCount}</div>
            <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>Archived / Inactive</div>
          </div>
        </div>

        <div
          className="card soft"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Tag size={18} color="var(--secondary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{categories.length}</div>
            <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>Categories</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search items or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 38, width: "100%", fontSize: "0.85rem" }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: 160 }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ height: 38, fontSize: "0.85rem", width: "100%" }}
          >
            <option value="all">All Categories ({totalCount})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({materials.filter((m) => m.category === c).length})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: 140 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 38, fontSize: "0.85rem", width: "100%" }}
          >
            <option value="all">All Status</option>
            <option value="active">Active only ({activeCount})</option>
            <option value="inactive">Inactive only ({inactiveCount})</option>
          </select>
        </div>

        {(search || categoryFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "0.78rem" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Materials Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item / Material</th>
              <th>Category</th>
              <th>Rate / kg</th>
              <th>CO₂ Factor</th>
              <th>Linked Pickups</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr key={item.id} style={{ opacity: item.active === 1 ? 1 : 0.65 }}>
                  {/* Name */}
                  <td data-label="Item / Material">
                    <strong style={{ fontSize: "0.92rem", color: "var(--text)" }}>
                      {item.name}
                    </strong>
                  </td>

                  {/* Category */}
                  <td data-label="Category">
                    <span className="chip" style={{ fontSize: "0.75rem" }}>
                      {item.category}
                    </span>
                  </td>

                  {/* Rate */}
                  <td data-label="Rate / kg">
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                        fontSize: "0.92rem",
                      }}
                    >
                      {formatCurrency(item.rate_per_kg)}
                      <small style={{ fontWeight: 400, opacity: 0.8, marginLeft: 2 }}>/ kg</small>
                    </span>
                  </td>

                  {/* CO2 Factor */}
                  <td data-label="CO₂ Factor">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--tertiary)",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                      }}
                    >
                      <Leaf size={14} />
                      {item.co2_factor.toFixed(1)} kg CO₂/kg
                    </span>
                  </td>

                  {/* Linked Pickups */}
                  <td data-label="Linked Pickups">
                    <span className="muted" style={{ fontSize: "0.85rem" }}>
                      {item.pickup_count !== undefined ? `${item.pickup_count} requests` : "—"}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td data-label="Status">
                    <button
                      type="button"
                      disabled={togglingId === item.id}
                      onClick={() => toggleActive(item)}
                      className={item.active === 1 ? "badge-completed" : "badge-cancelled"}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        padding: "4px 10px",
                        fontSize: "0.76rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 8,
                      }}
                      title="Click to toggle active status in catalog"
                    >
                      {togglingId === item.id ? (
                        <LoaderCircle size={12} className="spin" />
                      ) : (
                        <Power size={11} />
                      )}
                      {item.active === 1 ? "Active" : "Archived"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td data-label="Actions" style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMaterial(item);
                          setActiveModal("edit");
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "5px 10px", fontSize: "0.76rem", gap: 4 }}
                        title="Edit item type"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "5px 10px", fontSize: "0.76rem", gap: 4 }}
                        title="Delete item type"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: "32px 16px" }}>
                  {search || categoryFilter !== "all" || statusFilter !== "all"
                    ? "No item types match your current search/filter criteria."
                    : "No item types configured in catalog yet. Click \"Add Item Type\" above."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {activeModal && (
        <ItemTypeModal
          mode={activeModal}
          material={selectedMaterial}
          existingCategories={categories}
          onClose={() => {
            setActiveModal(null);
            setSelectedMaterial(null);
          }}
          onSuccess={(saved) => {
            if (activeModal === "create") {
              setMaterials((prev) => [saved, ...prev]);
              showNotification("success", `Added "${saved.name}" to catalog.`);
            } else {
              setMaterials((prev) =>
                prev.map((m) => (m.id === saved.id ? { ...m, ...saved } : m))
              );
              showNotification("success", `Updated "${saved.name}".`);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(8, 16, 14, 0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="glass card"
            style={{
              width: "min(460px, 100%)",
              padding: "24px 26px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255, 142, 133, 0.15)",
                  color: "var(--danger)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Trash2 size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Delete Item Type?</h3>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "var(--text)" }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.category})?
            </p>

            {(deleteTarget.pickup_count ?? 0) > 0 ? (
              <div
                className="card soft"
                style={{
                  padding: "10px 14px",
                  fontSize: "0.82rem",
                  marginBottom: 18,
                  borderColor: "rgba(255, 209, 102, 0.3)",
                }}
              >
                <strong style={{ color: "var(--warning)" }}>Notice:</strong> This item is linked to{" "}
                <strong>{deleteTarget.pickup_count} existing pickup request(s)</strong>. To preserve historical
                order audit and receipts, it will be <strong>archived and deactivated</strong> from public forms instead of corrupting historical data.
              </div>
            ) : (
              <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 18px" }}>
                This item has no linked orders and will be permanently removed from the database.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn btn-danger"
                style={{ minWidth: 120 }}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle size={15} className="spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
