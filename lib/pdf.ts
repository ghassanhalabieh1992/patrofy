// PDF generation — runs client-side only (dynamic import required)

export interface PDFData {
  descricao: string
  resultado: string
  medidas?: { busto?: string; cintura?: string; quadril?: string; altura?: string }
}

export async function downloadMoldePDF(data: PDFData, filename = "molde-patrofy.pdf") {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const marginL = 14;
  const marginR = W - 14;
  const contentWidth = marginR - marginL;

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(55, 48, 163); // indigo-700
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Patrofy.ai", marginL, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de IA para Geração de Moldes", 57, 14);
  const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(dateStr, marginR, 14, { align: "right" });

  let y = 34;

  // ── Description ──────────────────────────────────────────
  doc.setTextColor(99, 102, 241); // indigo-500
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", marginL, y);
  y += 5;
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, marginR, y);
  y += 6;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(data.descricao, contentWidth);
  doc.text(descLines, marginL, y);
  y += descLines.length * 5.5 + 8;

  // ── Measurements table (if provided) ────────────────────
  const medidasEntries = Object.entries(data.medidas ?? {}).filter(([, v]) => v);
  if (medidasEntries.length > 0) {
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("MEDIDAS DO CLIENTE", marginL, y);
    y += 5;
    doc.line(marginL, y, marginR, y);
    y += 7;

    const labels: Record<string, string> = { busto: "Busto", cintura: "Cintura", quadril: "Quadril", altura: "Altura" };
    const cols = Math.min(medidasEntries.length, 4);
    const colW = contentWidth / cols;
    medidasEntries.forEach(([key, val], i) => {
      const cx = marginL + i * colW;
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(cx, y - 4, colW - 4, 16, 2, 2, "F");
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(labels[key] ?? key, cx + 4, y + 2);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.text(`${val} cm`, cx + 4, y + 9);
    });
    y += 24;
  }

  // ── Pattern content ──────────────────────────────────────
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MOLDE GERADO", marginL, y);
  y += 5;
  doc.line(marginL, y, marginR, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const resultLines = doc.splitTextToSize(data.resultado, contentWidth);
  resultLines.forEach((line: string) => {
    if (y > 272) {
      doc.addPage();
      y = 16;
    }
    // Bold for section headers (lines ending with : or starting with uppercase word + :)
    if (/^[A-ZÁÉÍÓÚ\s]+:/.test(line.trim())) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 48, 163);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
    }
    doc.text(line, marginL, y);
    y += 5.5;
  });

  // ── Footer ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 255);
    doc.rect(0, 283, W, 14, "F");
    doc.setTextColor(130, 130, 160);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("Gerado por Patrofy.ai — patrofy.com", marginL, 290);
    doc.text(`Página ${i} de ${pageCount}`, marginR, 290, { align: "right" });
  }

  doc.save(filename);
}
