/* global require */
const fs = require('fs');

const css = `
/* ========================================= */
/* FIX: PAGINATION PAGEDOWN VISIBILITY       */
/* ========================================= */
.mmh-pagination-select {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--mmh-border);
  background: var(--mmh-card);
  color: var(--mmh-text);
  font-size: 11px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  appearance: auto;
  min-width: 60px;
  text-align: center;
}

.mmh-pagination-select option {
  background: var(--mmh-card);
  color: var(--mmh-text);
  font-weight: 600;
}

[data-scheme='dark'] .mmh-pagination-select option {
  background: #0f172a;
  color: #f1f5f9;
}

[data-scheme='light'] .mmh-pagination-select option {
  background: #ffffff;
  color: #0f172a;
}

/* ========================================= */
/* MOBILE RESPONSIVENESS (ADDED)             */
/* ========================================= */

/* FIX 1 — LAYOUT: Sidebar + Main Content */
@media (max-width: 768px) {
  .mmh-sidebar {
    position: fixed !important;
    left: -240px;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.4);
  }
  .mmh-sidebar.open {
    left: 0;
  }
  .mmh-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  .mmh-sidebar-overlay.visible {
    display: block;
  }
  .mmh-main {
    margin-left: 0 !important;
    width: 100%;
  }
  .mmh-topbar {
    padding: 0 12px !important;
    height: 56px !important;
  }
  .mmh-page {
    padding: 12px !important;
  }
  .mmh-topbar-date {
    display: none !important;
  }
  .mmh-topbar-title {
    font-size: 14px !important;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mmh-topbar-right {
    gap: 6px !important;
  }
}

/* FIX 2 — TABLES: Horizontal Scroll on Mobile */
.mmh-table-wrap, .mmh-table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .mmh-table, .mmh-results-table {
    min-width: 600px; 
  }
  .mmh-table th,
  .mmh-table td,
  .mmh-results-table th,
  .mmh-results-table td {
    padding: 10px 10px !important;
    font-size: 12px !important;
    white-space: nowrap;
  }
}

/* FIX 3 — STAT CARDS ROW */
.mmh-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 1024px) {
  .mmh-stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .mmh-stats-row, .mmh-stats-grid { 
    grid-template-columns: repeat(2, 1fr) !important; 
    gap: 8px !important; 
  }
  .mmh-stat-card { padding: 12px !important; }
  .mmh-stat-card-value { font-size: 24px !important; }
}

/* FIX 4 — TOP TABS (horizontal scroll) */
.mmh-tabs-row {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--mmh-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; 
}
.mmh-tabs-row::-webkit-scrollbar { display: none; }
.mmh-tab {
  white-space: nowrap;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .mmh-tab {
    padding: 10px 14px !important;
    font-size: 12px !important;
  }
}

/* FIX 5 — TWO COLUMN LAYOUTS → STACK */
.mmh-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 768px) {
  .mmh-2col, .mmh-leave-2col, .mmh-examine-2col, [style*="grid-template-columns: 1fr 1.8fr"] {
    grid-template-columns: 1fr !important;
  }
}

/* FIX 6 — FILTER ROWS → STACK */
.mmh-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 14px;
}
@media (max-width: 768px) {
  .mmh-filter-row, .mmh-form-grid {
    flex-direction: column !important;
    grid-template-columns: 1fr !important;
    align-items: stretch !important;
  }
  .mmh-filter-row .mmh-input, .mmh-filter-row .mmh-select, .mmh-form-grid .mmh-input, .mmh-form-grid .mmh-input-select {
    width: 100% !important;
  }
  .mmh-filter-row button, .mmh-form-grid button {
    width: 100% !important;
  }
}

/* FIX 7 — PAYMENT METHOD CARDS */
.mmh-payment-methods, .mmh-payment-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 768px) {
  .mmh-payment-methods, .mmh-payment-grid-compact {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }
  .mmh-payment-method-card, .mmh-payment-card-sm {
    padding: 10px 8px !important;
    font-size: 12px !important;
  }
}
@media (max-width: 400px) {
  .mmh-payment-methods, .mmh-payment-grid-compact { grid-template-columns: repeat(2, 1fr) !important; }
}

/* FIX 8 — MODALS: Full screen on mobile */
@media (max-width: 768px) {
  .mmh-modal {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
    overflow-y: auto;
  }
  .mmh-overlay {
    align-items: flex-end;
  }
  .mmh-modal-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--mmh-card);
  }
}

/* FIX 10 — PAYROLL TABLE ROW */
@media (max-width: 768px) {
  .mmh-payroll-table-row {
    grid-template-columns: 2fr 1fr 1fr !important;
    gap: 4px;
    font-size: 11px;
    padding: 10px 10px;
  }
  .mmh-payroll-col-hide { display: none; }
}

/* FIX 11 — FORMS: Full width on mobile */
@media (max-width: 768px) {
  .mmh-input, .mmh-input-select, .mmh-select, .mmh-textarea {
    font-size: 16px !important;
  }
  .mmh-date-row {
    flex-direction: column;
  }
  .mmh-date-row .mmh-input { width: 100%; }
  .mmh-form-grid-2 { grid-template-columns: 1fr !important; }
}

/* FIX 12 — SETTINGS PAGE */
@media (max-width: 768px) {
  .mmh-theme-grid, .mmh-settings-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .mmh-scheme-btn { width: 100% !important; }
  .mmh-settings-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* FIX 13 — HR PAGE SHIFT GRID */
@media (max-width: 768px) {
  .mmh-shift-table-wrap { overflow-x: auto; }
  .mmh-att-cal { gap: 3px; }
  .mmh-att-cal-day { font-size: 10px; border-radius: 5px; }
  .mmh-leave-bal-row { grid-template-columns: 1fr !important; }
}
`;
fs.appendFileSync('c:/Users/haider.ali/Downloads/AntiMMH/frontend/src/styles/mmh.css', css, 'utf8');
