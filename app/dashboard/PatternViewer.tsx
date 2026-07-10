"use client";

import { useState, useCallback } from "react";
import { pathToSVG } from "@/lib/patterns";
import type { PatternData, PatternPiece } from "@/lib/patterns";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_CM  = 6    // screen preview scale
const A4_W_MM    = 190  // A4 usable width  (mm, with 10mm margins)
const A4_H_MM    = 270  // A4 usable height
const A4_W_CM    = A4_W_MM / 10
const A4_H_CM    = A4_H_MM / 10
const OVERLAP_CM = 1    // page overlap for taping

// ── SVG for a single pattern piece ───────────────────────────────────────────
function PieceSVG({ piece, scale = PX_PER_CM, dict }: { piece: PatternPiece; scale?: number; dict: Dictionary }) {
  const pad   = 4 * scale
  const bbox  = piece.bbox
  const vw    = (bbox.w + 2) * scale + pad * 2
  const vh    = (bbox.h + 2) * scale + pad * 2
  const ox    = pad + scale   // origin offset to avoid clipping
  const oy    = pad + scale

  // Offset all paths to start at ox,oy
  const translate = (cmds: typeof piece.cutPath) => pathToSVG(
    cmds.map(c => {
      if (c.t === 'Z') return c
      if (c.t === 'M' || c.t === 'L')
        return { ...c, x: c.x + bbox.w * 0 + 0, y: c.y + 0 }
      if (c.t === 'Q')
        return { ...c, cx: c.cx, cy: c.cy }
      return c
    }),
    scale
  )

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width={vw}
      height={vh}
      style={{ background: "white", display: "block" }}
    >
      {/* White background */}
      <rect width={vw} height={vh} fill="white" />

      {/* Grid (1cm squares) */}
      <defs>
        <pattern id={`grid-${piece.id}`} width={scale} height={scale} patternUnits="userSpaceOnUse">
          <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#e5e7eb" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width={vw} height={vh} fill={`url(#grid-${piece.id})`} />

      <g transform={`translate(${ox},${oy})`}>

        {/* Cut line — dashed red */}
        <path
          d={pathToSVG(piece.cutPath, scale)}
          fill="#fef2f2"
          stroke="#dc2626"
          strokeWidth="1.5"
          strokeDasharray="6,3"
        />

        {/* Seam line — solid navy */}
        <path
          d={pathToSVG(piece.seamPath, scale)}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="1"
        />

        {/* Fold line (if any) */}
        {piece.foldEdge && (
          <line
            x1={piece.foldEdge[0].x * scale} y1={piece.foldEdge[0].y * scale}
            x2={piece.foldEdge[1].x * scale} y2={piece.foldEdge[1].y * scale}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="8,3,2,3"
          />
        )}

        {/* Darts */}
        {piece.darts.map((dart, i) => (
          <g key={i}>
            <line
              x1={dart.leg1.x * scale} y1={dart.leg1.y * scale}
              x2={dart.tip.x  * scale} y2={dart.tip.y  * scale}
              stroke="#1e3a5f" strokeWidth="0.8"
            />
            <line
              x1={dart.tip.x  * scale} y1={dart.tip.y  * scale}
              x2={dart.leg2.x * scale} y2={dart.leg2.y * scale}
              stroke="#1e3a5f" strokeWidth="0.8"
            />
            {dart.label && (
              <text
                x={(dart.leg1.x + dart.leg2.x) / 2 * scale}
                y={(dart.tip.y - 1) * scale}
                fontSize={scale * 0.7}
                fill="#374151"
                textAnchor="middle"
              >
                {dart.label}
              </text>
            )}
          </g>
        ))}

        {/* Notches — small perpendicular marks */}
        {piece.notches.map((n, i) => (
          <line
            key={i}
            x1={(n.pt.x - Math.sin(n.angle * Math.PI / 180) * 0.4) * scale}
            y1={(n.pt.y - Math.cos(n.angle * Math.PI / 180) * 0.4) * scale}
            x2={(n.pt.x + Math.sin(n.angle * Math.PI / 180) * 0.4) * scale}
            y2={(n.pt.y + Math.cos(n.angle * Math.PI / 180) * 0.4) * scale}
            stroke="#ef4444" strokeWidth="1.5"
          />
        ))}

        {/* Grain line with arrows */}
        {(() => {
          const [g1, g2] = piece.grainLine
          const mx = (g1.x + g2.x) / 2 * scale
          const my = (g1.y + g2.y) / 2 * scale
          return (
            <g stroke="#6b7280" strokeWidth="0.7">
              <line
                x1={g1.x * scale} y1={g1.y * scale}
                x2={g2.x * scale} y2={g2.y * scale}
              />
              {/* Arrow heads */}
              <polyline points={`${g1.x * scale - 3},${g1.y * scale + 5} ${g1.x * scale},${g1.y * scale} ${g1.x * scale + 3},${g1.y * scale + 5}`} fill="none" />
              <polyline points={`${g2.x * scale - 3},${g2.y * scale - 5} ${g2.x * scale},${g2.y * scale} ${g2.x * scale + 3},${g2.y * scale - 5}`} fill="none" />
              <text x={mx} y={my - 4} fontSize={scale * 0.65} fill="#6b7280" textAnchor="middle">{dict.patternViewer.fio}</text>
            </g>
          )
        })()}

        {/* Piece label (center of piece) */}
        <text
          x={(bbox.w / 2) * scale}
          y={(bbox.h / 2) * scale}
          fontSize={scale * 1.3}
          fontWeight="600"
          fill="#1e3a5f"
          textAnchor="middle"
          opacity="0.35"
        >
          {piece.name}
        </text>

        {/* Fold label */}
        {piece.onFold && (
          <text
            x={-scale * 0.3}
            y={(bbox.h / 2) * scale}
            fontSize={scale * 0.65}
            fill="#3b82f6"
            textAnchor="middle"
            transform={`rotate(-90, ${-scale * 0.3}, ${(bbox.h / 2) * scale})`}
          >
            {dict.patternViewer.dobrarAqui}
          </text>
        )}
      </g>
    </svg>
  )
}

// ── A4 Tiled PDF Export ───────────────────────────────────────────────────────
async function printPatternPDF(pattern: PatternData, dict: Dictionary) {
  const { default: jsPDF } = await import("jspdf");

  let doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210; const PH = 297;  // full A4
  const ML = 10; const MT = 10;    // margins
  const UW = PW - ML * 2;          // usable width
  const UH = PH - MT * 2;          // usable height

  let isFirstPage = true;

  for (const piece of pattern.pieces) {
    const pieceW_cm = piece.bbox.w;
    const pieceH_cm = piece.bbox.h;
    const pieceW_mm = pieceW_cm * 10;
    const pieceH_mm = pieceH_cm * 10;

    // How many A4 tiles?
    const cols = Math.ceil(pieceW_mm / (UW - OVERLAP_CM * 10));
    const rows = Math.ceil(pieceH_mm / (UH - OVERLAP_CM * 10));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        // Clip origin for this tile (in cm)
        const clipX_cm = col * (A4_W_CM - OVERLAP_CM);
        const clipY_cm = row * (A4_H_CM - OVERLAP_CM);

        // ── Draw page content ──────────────────────────────────

        // 1cm grid
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        for (let gx = 0; gx <= UW + 10; gx += 10) {
          doc.line(ML + gx % UW, MT, ML + gx % UW, PH - MT);
        }
        for (let gy = 0; gy <= UH + 10; gy += 10) {
          doc.line(ML, MT + gy % UH, PW - ML, MT + gy % UH);
        }

        // Draw pattern piece paths (translate by -clipX, -clipY)
        const drawPath = (cmds: typeof piece.cutPath, color: string, dash: boolean) => {
          doc.setDrawColor(color);
          doc.setLineWidth(dash ? 0.3 : 0.2);

          let cx = 0, cy = 0;
          for (const cmd of cmds) {
            if (cmd.t === 'Z') break;
            const px = (cmd.x - clipX_cm) * 10 + ML;
            const py = (cmd.y - clipY_cm) * 10 + MT;

            if (cmd.t === 'M') { cx = px; cy = py; }
            else if (cmd.t === 'L') {
              if (px >= ML && px <= PW - ML && py >= MT && py <= PH - MT) {
                doc.line(cx, cy, px, py);
              }
              cx = px; cy = py;
            }
            else if (cmd.t === 'Q') {
              // Approximate quadratic bezier with 8 segments
              const qcx = (cmd.cx - clipX_cm) * 10 + ML;
              const qcy = (cmd.cy - clipY_cm) * 10 + MT;
              const steps = 8;
              let lx = cx, ly = cy;
              for (let s = 1; s <= steps; s++) {
                const t2 = s / steps;
                const nx = (1-t2)*(1-t2)*cx + 2*(1-t2)*t2*qcx + t2*t2*px;
                const ny = (1-t2)*(1-t2)*cy + 2*(1-t2)*t2*qcy + t2*t2*py;
                doc.line(lx, ly, nx, ny);
                lx = nx; ly = ny;
              }
              cx = px; cy = py;
            }
          }
        };

        // Fill cut area (light red)
        // Draw cut line (red dashed)
        doc.setDrawColor(180, 0, 0);
        doc.setLineWidth(0.5);
        drawPath(piece.cutPath, "#b91c1c", true);

        // Draw seam line (navy)
        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(0.3);
        drawPath(piece.seamPath, "#1e3a5f", false);

        // Draw darts
        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(0.2);
        for (const dart of piece.darts) {
          const d = [dart.leg1, dart.tip, dart.leg2];
          for (let i = 0; i < d.length - 1; i++) {
            const ax = (d[i].x - clipX_cm) * 10 + ML;
            const ay = (d[i].y - clipY_cm) * 10 + MT;
            const bx = (d[i+1].x - clipX_cm) * 10 + ML;
            const by = (d[i+1].y - clipY_cm) * 10 + MT;
            doc.line(ax, ay, bx, by);
          }
        }

        // Draw grain line
        const [gl1, gl2] = piece.grainLine;
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.2);
        const gx1 = (gl1.x - clipX_cm) * 10 + ML;
        const gy1 = (gl1.y - clipY_cm) * 10 + MT;
        const gx2 = (gl2.x - clipX_cm) * 10 + ML;
        const gy2 = (gl2.y - clipY_cm) * 10 + MT;
        doc.line(gx1, gy1, gx2, gy2);

        // ── Alignment crosses at page corners ──────────────────
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        const crosses = [[ML, MT], [PW - ML, MT], [ML, PH - MT], [PW - ML, PH - MT]];
        for (const [cx2, cy2] of crosses) {
          doc.line(cx2 - 4, cy2, cx2 + 4, cy2);
          doc.line(cx2, cy2 - 4, cx2, cy2 + 4);
        }

        // ── Scale bar (10cm) ────────────────────────────────────
        const sbx = ML + 2; const sby = PH - MT - 8;
        doc.setDrawColor(0); doc.setLineWidth(0.4);
        doc.line(sbx, sby, sbx + 100, sby);
        doc.line(sbx, sby - 2, sbx, sby + 2);
        doc.line(sbx + 100, sby - 2, sbx + 100, sby + 2);
        doc.setFontSize(7); doc.setTextColor(0);
        doc.text("10 cm", sbx + 102, sby + 1.5);

        // ── Header info ─────────────────────────────────────────
        doc.setFontSize(8); doc.setTextColor(80);
        doc.text(`Patrofy.ai — ${pattern.garment} ${pattern.sizeName}`, ML + 2, MT - 2);
        doc.text(`${dict.patternViewer.peca}: ${piece.name} | ${piece.cutInfo}`, ML + 2, MT + 4);
        doc.text(`${dict.patternViewer.pagina} ${col + 1}/${cols} × ${row + 1}/${rows}`, PW - ML - 30, MT - 2);
        doc.text(dict.patternViewer.margemCosturaLinha(pattern.seamAllowance), ML + 2, PH - MT - 3);
      }
    }
  }

  doc.save(`patrofy-${pattern.garment.replace(/\s/g, '-')}-${pattern.sizeName}.pdf`);
}

// ── SVG Export ────────────────────────────────────────────────────────────────
function downloadPatternSVG(pattern: PatternData) {
  const PX = 37.795; // 1cm = 37.795px at 96dpi
  const GAP = 50;
  let totalW = GAP;
  const offsets: number[] = [];
  let maxH = 0;
  for (const piece of pattern.pieces) {
    offsets.push(totalW);
    totalW += piece.bbox.w * PX + GAP;
    maxH = Math.max(maxH, piece.bbox.h * PX);
  }
  const totalH = maxH + GAP * 2 + 40;

  let bodies = '';
  for (let i = 0; i < pattern.pieces.length; i++) {
    const p = pattern.pieces[i];
    const ox = offsets[i]; const oy = GAP;
    const cutD  = pathToSVG(p.cutPath,  PX);
    const seamD = pathToSVG(p.seamPath, PX);
    bodies += `<g transform="translate(${ox},${oy})" id="${p.id}">
  <path d="${cutD}"  fill="#fff5f5" stroke="#dc2626" stroke-width="0.8" stroke-dasharray="6,3"/>
  <path d="${seamD}" fill="none"    stroke="#1e3a5f" stroke-width="0.5"/>
  <line x1="${p.grainLine[0].x*PX}" y1="${p.grainLine[0].y*PX}" x2="${p.grainLine[1].x*PX}" y2="${p.grainLine[1].y*PX}" stroke="#6b7280" stroke-width="0.5"/>
  <text x="${p.bbox.w/2*PX}" y="${p.bbox.h/2*PX}" font-size="14" fill="#374151" text-anchor="middle" opacity="0.5">${p.name}</text>
  <text x="${p.bbox.w/2*PX}" y="${p.bbox.h*PX+16}" font-size="10" fill="#6b7280" text-anchor="middle">${p.bbox.w.toFixed(1)}×${p.bbox.h.toFixed(1)} cm · ${p.cutInfo}</text>
</g>\n`;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <title>Patrofy — ${pattern.garment} ${pattern.sizeName}</title>
  <defs><pattern id="g" width="${PX}" height="${PX}" patternUnits="userSpaceOnUse">
    <path d="M ${PX} 0 L 0 0 0 ${PX}" fill="none" stroke="#e5e7eb" stroke-width="0.2"/>
  </pattern></defs>
  <rect width="${totalW}" height="${totalH}" fill="white"/>
  <rect width="${totalW}" height="${totalH}" fill="url(#g)"/>
  ${bodies}
  <g transform="translate(${GAP},${totalH-20})">
    <line x1="0" y1="0" x2="${10*PX}" y2="0" stroke="black" stroke-width="0.5"/>
    <line x1="0" y1="-4" x2="0" y2="4" stroke="black" stroke-width="0.5"/>
    <line x1="${10*PX}" y1="-4" x2="${10*PX}" y2="4" stroke="black" stroke-width="0.5"/>
    <text x="${5*PX}" y="12" font-size="10" text-anchor="middle">10 cm</text>
  </g>
</svg>`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.download = `patrofy-${pattern.garment.replace(/\s/g,'-')}-${pattern.sizeName}.svg`;
  a.click();
}

// ── DXF Export (compatible with cutting machines) ─────────────────────────────
function downloadPatternDXF(pattern: PatternData) {
  let dxf = '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';
  let offsetX = 0;
  for (const piece of pattern.pieces) {
    const pts: string[] = [];
    for (const cmd of piece.cutPath) {
      if (cmd.t === 'Z') continue;
      if (cmd.t === 'M' || cmd.t === 'L')
        pts.push(`10\n${((cmd.x + offsetX)*10).toFixed(3)}\n20\n${(cmd.y*10).toFixed(3)}\n30\n0.0`);
    }
    dxf += `0\nLWPOLYLINE\n8\nCUT\n70\n1\n90\n${pts.length}\n${pts.join('\n')}\n`;

    const seamPts: string[] = [];
    for (const cmd of piece.seamPath) {
      if (cmd.t === 'Z') continue;
      if (cmd.t === 'M' || cmd.t === 'L')
        seamPts.push(`10\n${((cmd.x + offsetX)*10).toFixed(3)}\n20\n${(cmd.y*10).toFixed(3)}\n30\n0.0`);
    }
    dxf += `0\nLWPOLYLINE\n8\nSEAM\n70\n1\n90\n${seamPts.length}\n${seamPts.join('\n')}\n`;
    offsetX += piece.bbox.w + 5;
  }
  dxf += '0\nENDSEC\n0\nEOF';

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([dxf], { type: 'application/dxf' }));
  a.download = `patrofy-${pattern.garment.replace(/\s/g,'-')}-${pattern.sizeName}.dxf`;
  a.click();
}

// ── Main PatternViewer Component ──────────────────────────────────────────────
export function PatternViewer({ pattern }: { pattern: PatternData }) {
  const { dict } = useLanguage();
  const pv = dict.patternViewer;
  const [selectedPiece, setSelectedPiece] = useState<string>(pattern.pieces[0]?.id ?? '');
  const [printing, setPrinting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    try { await printPatternPDF(pattern, dict); } finally { setPrinting(false); }
  }, [pattern, dict]);

  const currentPiece = pattern.pieces.find(p => p.id === selectedPiece) ?? pattern.pieces[0];

  const totalPages = pattern.pieces.reduce((sum, p) => {
    const cols = Math.ceil((p.bbox.w * 10) / (A4_W_MM - OVERLAP_CM * 10));
    const rows = Math.ceil((p.bbox.h * 10) / (A4_H_MM - OVERLAP_CM * 10));
    return sum + cols * rows;
  }, 0);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 text-slate-900 mt-3">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-900 text-white">
        <div>
          <p className="font-semibold text-sm">{pattern.garment}</p>
          <p className="text-xs text-indigo-300">{pattern.sizeName} — {pv.seamAllowanceLabel}: {pattern.seamAllowance}cm · {pv.hemLabel}: {pattern.hemAllowance}cm</p>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* PDF button */}
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            {printing ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '↓'}
            {pv.pdfButton(totalPages)}
          </button>
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExport(v => !v)}
              className="flex items-center gap-1.5 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              {pv.exportar}
            </button>
            {showExport && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 w-48 z-50 overflow-hidden">
                <button onClick={() => { downloadPatternSVG(pattern); setShowExport(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <span className="text-lg">🎨</span>
                  <div><p className="font-medium">SVG</p><p className="text-xs text-slate-400">{pv.svgDesc}</p></div>
                </button>
                <button onClick={() => { downloadPatternDXF(pattern); setShowExport(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-100">
                  <span className="text-lg">✂️</span>
                  <div><p className="font-medium">DXF</p><p className="text-xs text-slate-400">{pv.dxfDesc}</p></div>
                </button>
                <button onClick={() => { handlePrint(); setShowExport(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-100">
                  <span className="text-lg">🖨️</span>
                  <div><p className="font-medium">PDF A4</p><p className="text-xs text-slate-400">{pv.pdfA4Desc}</p></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Piece tabs */}
      <div className="flex gap-1 px-3 pt-3 overflow-x-auto">
        {pattern.pieces.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPiece(p.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedPiece === p.id
                ? 'bg-indigo-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* SVG Viewer */}
      {currentPiece && (
        <div className="p-3">
          {/* Piece info bar */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                <strong className="text-slate-700">{currentPiece.cutInfo}</strong>
              </span>
              <span>
                {currentPiece.bbox.w.toFixed(1)} × {currentPiece.bbox.h.toFixed(1)} cm
              </span>
              {currentPiece.onFold && (
                <span className="text-blue-600 font-medium">{pv.foldOnBlueLine}</span>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4,2"/></svg>
                {pv.legendCortar}
              </span>
              <span className="flex items-center gap-1">
                <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#1e3a5f" strokeWidth="1"/></svg>
                {pv.legendCosturar}
              </span>
              <span className="flex items-center gap-1">
                <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#3b82f6" strokeWidth="1" strokeDasharray="6,2,2,2"/></svg>
                {pv.legendDobrar}
              </span>
            </div>
          </div>

          {/* Scrollable SVG area */}
          <div className="overflow-auto border border-slate-200 rounded-xl bg-slate-50" style={{ maxHeight: '50vh' }}>
            <PieceSVG piece={currentPiece} scale={PX_PER_CM} dict={dict} />
          </div>

          {/* Scale note */}
          <p className="text-xs text-slate-400 mt-2 text-center">
            {pv.scaleNote}
          </p>
        </div>
      )}

      {/* Measurements summary */}
      <div className="px-4 pb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{pv.medidasUtilizadas}</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(pattern.measurements)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="text-xs">
                  <span className="text-slate-400">{dict.dashboard.fieldLabels[k] ?? k}:</span>{' '}
                  <span className="font-semibold text-slate-700">{v} cm</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
