"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  billNo: string;
  targetId?: string; // ID of the element to capture; defaults to "ebill-card"
}

export function DownloadPdfButton({ billNo, targetId = "ebill-card" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const el = document.getElementById(targetId);
      if (!el) {
        alert("Bill element not found.");
        return;
      }

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        onclone: (clonedDoc) => {
          // Always force light, print-friendly styles on the clone
          const clonedEl = clonedDoc.getElementById(targetId);
          if (!clonedEl) return;

          // Hide the download button inside the clone
          const dlBtn = clonedDoc.getElementById("download-pdf-btn");
          if (dlBtn) dlBtn.style.display = "none";

          // Override CSS variables to white/light on the root
          clonedDoc.documentElement.removeAttribute("data-theme");
          clonedDoc.documentElement.style.setProperty("--surface", "#ffffff");
          clonedDoc.documentElement.style.setProperty("--surface-lowest", "#f8faf9");
          clonedDoc.documentElement.style.setProperty("--surface-low", "#f0f5f2");
          clonedDoc.documentElement.style.setProperty("--text", "#111111");
          clonedDoc.documentElement.style.setProperty("--muted", "#4a5c56");
          clonedDoc.documentElement.style.setProperty("--primary", "#00794b");
          clonedDoc.documentElement.style.setProperty("--primary-soft", "#006040");
          clonedDoc.documentElement.style.setProperty("--secondary", "#005f73");
          clonedDoc.documentElement.style.setProperty("--outline", "#c0d0ca");
          clonedDoc.documentElement.style.setProperty("--warning", "#9e6f00");
          clonedDoc.documentElement.style.setProperty("--shadow", "none");

          // Force the card itself to white bg
          clonedEl.style.background = "#ffffff";
          clonedEl.style.color = "#111111";
          clonedEl.style.border = "none";
          clonedEl.style.boxShadow = "none";

          // Walk every element and fix up any dark hardcoded backgrounds
          const allEls = clonedEl.querySelectorAll<HTMLElement>("*");
          allEls.forEach((child) => {
            const cs = window.getComputedStyle(child);
            const bg = cs.backgroundColor;

            // Replace dark backgrounds with white/near-white
            if (
              bg &&
              bg !== "rgba(0, 0, 0, 0)" &&
              bg !== "transparent"
            ) {
              // Parse r,g,b values
              const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                // If it's a dark colour (luminance < 80), replace with a near-white tint
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                if (luminance < 80) {
                  child.style.background = "rgba(0,0,0,0.03)";
                  child.style.backgroundColor = "rgba(0,0,0,0.03)";
                }
              }
            }

            // Fix dark text colors
            const color = cs.color;
            if (color) {
              const match2 = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match2) {
                const r = parseInt(match2[1]);
                const g = parseInt(match2[2]);
                const b = parseInt(match2[3]);
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                // If text is very light (near white), make it dark
                if (lum > 200) {
                  child.style.color = "#111111";
                }
              }
            }

            // Fix table borders
            child.style.borderColor = child.style.borderColor
              ? child.style.borderColor.replace(/rgba\(255,255,255,[0-9.]+\)/, "rgba(0,0,0,0.1)")
              : child.style.borderColor;
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const finalHeight = Math.min(imgHeight, pageHeight);
      const finalWidth = (finalHeight / imgHeight) * imgWidth;
      const xOffset = (pageWidth - finalWidth) / 2;

      pdf.addImage(imgData, "PNG", xOffset, 10, finalWidth, finalHeight - 10);
      pdf.save(`${billNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn btn-primary"
      style={{ gap: 9 }}
      id="download-pdf-btn"
    >
      {loading ? (
        <>
          <Loader2 size={15} className="spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download size={15} />
          Download PDF
        </>
      )}
    </button>
  );
}

