"use client";

import React, { useState } from "react";
import { FileText, Award, X, Download, Loader2 } from "lucide-react";
import { EBillCard, BillData } from "@/components/ui/ebill-card";
import ScrapixCertificate from "@/components/ui/certificate";

interface Props {
  bill: BillData;
  showBankWarning?: boolean;
}

type Modal = "bill" | "certificate" | null;

async function downloadAsPdf(targetId: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const el = document.getElementById(targetId);
  if (!el) throw new Error("Element not found: " + targetId);

  const canvas = await html2canvas(el, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(targetId);
      if (!clonedEl) return;

      clonedDoc.documentElement.setAttribute("data-theme", "light");
      clonedDoc.documentElement.style.setProperty("--surface", "#ffffff");
      clonedDoc.documentElement.style.setProperty("--surface-lowest", "#f8faf9");
      clonedDoc.documentElement.style.setProperty("--surface-low", "#f0f5f2");
      clonedDoc.documentElement.style.setProperty("--text", "#111111");
      clonedDoc.documentElement.style.setProperty("--muted", "#4a5c56");
      clonedDoc.documentElement.style.setProperty("--primary", "#00794b");
      clonedDoc.documentElement.style.setProperty("--secondary", "#005f73");
      clonedDoc.documentElement.style.setProperty("--outline", "#c0d0ca");
      clonedDoc.documentElement.style.setProperty("--warning", "#9e6f00");
      clonedDoc.documentElement.style.setProperty("--shadow", "none");

      clonedEl.style.background = "#ffffff";
      clonedEl.style.color = "#111111";
      clonedEl.style.border = "none";
      clonedEl.style.boxShadow = "none";

      clonedEl.querySelectorAll<HTMLElement>(".brand-logo").forEach((img) => {
        img.style.filter = "none";
      });

      clonedEl.querySelectorAll<HTMLElement>("*").forEach((child) => {
        const cs = window.getComputedStyle(child);
        const bg = cs.backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (m) {
            const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
            if (lum < 80) {
              child.style.background = "rgba(0,0,0,0.03)";
              child.style.backgroundColor = "rgba(0,0,0,0.03)";
            }
          }
        }
        const color = cs.color;
        if (color) {
          const m2 = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (m2) {
            const lum = 0.299 * +m2[1] + 0.587 * +m2[2] + 0.114 * +m2[3];
            if (lum > 200) child.style.color = "#111111";
          }
        }
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");

  // For certificate use landscape; for bill use portrait
  const isLandscape = targetId === "scrapix-certificate";
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const imgAspect = canvas.width / canvas.height;
  const pageAspect = pw / ph;

  let drawW: number, drawH: number, x: number, y: number;
  if (imgAspect > pageAspect) {
    drawW = pw - 10;
    drawH = drawW / imgAspect;
    x = 5;
    y = (ph - drawH) / 2;
  } else {
    drawH = ph - 10;
    drawW = drawH * imgAspect;
    x = (pw - drawW) / 2;
    y = 5;
  }

  pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
  pdf.save(`${filename}.pdf`);
}

export function BillDocuments({ bill, showBankWarning }: Props) {
  const [open, setOpen] = useState<Modal>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [loadingCert, setLoadingCert] = useState(false);

  function closeModal() {
    setOpen(null);
  }

  async function handleDownload(
    targetId: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) {
    setLoading(true);
    try {
      await downloadAsPdf(targetId, filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Action Buttons ───────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {/* View Bill */}
        <button
          onClick={() => setOpen("bill")}
          className="btn btn-primary"
          style={{ gap: 9, minWidth: 180, fontSize: "0.97rem", padding: "12px 28px" }}
        >
          <FileText size={17} />
          View E-Bill
        </button>

        {/* View Certificate */}
        <button
          onClick={() => setOpen("certificate")}
          className="btn btn-secondary"
          style={{ gap: 9, minWidth: 180, fontSize: "0.97rem", padding: "12px 28px" }}
        >
          <Award size={17} />
          View Certificate
        </button>
      </div>

      {/* ── Bill Modal ───────────────────────────────────────── */}
      {open === "bill" && (
        <ModalOverlay onClose={closeModal}>
          <div
            style={{
              width: "100%",
              maxWidth: 800,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "4px 4px 24px",
            }}
          >
            <EBillCard bill={bill} showBankWarning={showBankWarning} />

            {/* Download bill */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={() =>
                  handleDownload("ebill-card", bill.bill_no, setLoadingBill)
                }
                disabled={loadingBill}
                className="btn btn-primary"
                style={{ gap: 9 }}
              >
                {loadingBill ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Download Bill PDF
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ gap: 7 }}
              >
                <X size={14} />
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Certificate Modal ────────────────────────────────── */}
      {open === "certificate" && (
        <ModalOverlay onClose={closeModal}>
          <div
            style={{
              width: "100%",
              maxWidth: 920,
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "4px 4px 24px",
            }}
          >
            <ScrapixCertificate
              customerName={bill.customer_name}
              pickupDate={bill.created_at}
              billNo={bill.bill_no}
              weightKg={bill.actual_weight_kg}
              category={bill.material_category}
            />

            {/* Download certificate */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={() =>
                  handleDownload(
                    "scrapix-certificate",
                    `certificate-${bill.bill_no}`,
                    setLoadingCert
                  )
                }
                disabled={loadingCert}
                className="btn btn-primary"
                style={{ gap: 9 }}
              >
                {loadingCert ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Download Certificate PDF
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ gap: 7 }}
              >
                <X size={14} />
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

/* ── Modal Overlay ──────────────────────────────────────────── */
function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        overflowY: "auto",
        animation: "fadeIn 0.18s ease",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: 18,
          right: 20,
          zIndex: 10000,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          backdropFilter: "blur(4px)",
        }}
      >
        <X size={18} />
      </button>
      {children}
    </div>
  );
}
