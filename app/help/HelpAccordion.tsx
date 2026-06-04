"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };
type FaqSection = { category: string; emoji: string; items: FaqItem[] };

export default function HelpAccordion({ faq }: { faq: FaqSection[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {faq.map((section) => (
        <div key={section.category}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "0.7px",
            marginBottom: 8,
          }}>
            {section.category}
          </div>
          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            {section.items.map((item, i) => {
              const key = `${section.category}-${i}`;
              const isOpen = open === key;
              return (
                <div key={i} style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : key)}
                    style={{
                      width: "100%", padding: "14px 16px",
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                      fontFamily: "inherit", textAlign: "left",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.4 }}>
                      {item.q}
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 14px", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
