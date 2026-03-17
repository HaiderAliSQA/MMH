import React from 'react';

export interface DispensingSlipProps {
  dispense: {
    _id: string;
    patient: {
      name: string;
      mrNumber: string;
      age: number;
      gender: string;
      phone: string;
      cnic: string;
    };
    items: {
      medicineName: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      totalPrice: number;
    }[];
    totalAmount: number;
    dispensedBy: {
      name: string;
      role: string;
    };
    notes?: string;
    createdAt: string;
  };
}

export const printSlip = () => {
  const printWindow = window.open('', '', 'width=420,height=700');
  if (!printWindow) return;

  const content = document.getElementById('dispense-slip-content')?.innerHTML;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MMH Dispense Slip</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 16px; background: white; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .mmh-slip-dispense {
          background: white;
          color: #0f172a;
          padding: 24px;
          width: 350px;
          margin: 0 auto;
        }
        .mmh-slip-dispense-header {
          text-align: center;
          background: #064e3b;
          color: white;
          padding: 16px;
          border-radius: 10px 10px 0 0;
          margin: -24px -24px 18px;
        }
        .mmh-slip-dispense-title {
          font-size: 17px;
          font-weight: 900;
          font-style: italic;
        }
        .mmh-slip-dispense-sub {
          font-size: 11px;
          opacity: 0.75;
          margin-top: 3px;
        }
        .mmh-slip-section-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #064e3b;
          margin: 14px 0 8px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #d1fae5;
        }
        .mmh-slip-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 4px 0;
        }
        .mmh-slip-info-label {
          color: #94a3b8;
          min-width: 80px;
        }
        .mmh-slip-info-value {
          font-weight: 700;
          color: #0f172a;
          text-align: right;
        }
        .mmh-slip-medicine-item {
          padding: 8px 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        .mmh-slip-medicine-name {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .mmh-slip-medicine-detail {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
          display: flex;
          justify-content: space-between;
        }
        .mmh-slip-medicine-price {
          font-weight: 700;
          color: #064e3b;
        }
        .mmh-slip-total-box {
          background: #f0fdf4;
          border: 2px solid #064e3b;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 14px 0;
        }
        .mmh-slip-total-label {
          font-size: 13px;
          font-weight: 700;
          color: #064e3b;
        }
        .mmh-slip-total-amount {
          font-size: 22px;
          font-weight: 900;
          color: #064e3b;
          font-family: 'JetBrains Mono', monospace;
        }
        .mmh-slip-footer {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
        }

        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

const DispensingSlip: React.FC<DispensingSlipProps> = ({ dispense }) => {
  if (!dispense) return null;

  const date = new Date(dispense.createdAt || new Date());

  // Format slip number: DSP-YYYYMMDD-XXXX
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dId = dispense._id || '';
  const last4 = dId.substring(dId.length - 4).toUpperCase();
  const slipNo = `DSP-${year}${month}${day}-${last4}`;

  return (
    <div id="dispense-slip-content">
      <div className="mmh-slip-dispense">
        <div className="mmh-slip-dispense-header">
          <div className="mmh-slip-dispense-title">Majida Memorial Hospital</div>
          <div className="mmh-slip-dispense-sub">MMH · Chiniot</div>
          <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>── Medicine Dispense Slip ──</div>
        </div>

        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">Slip #:</span>
          <span className="mmh-slip-info-value">{slipNo}</span>
        </div>
        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">Date:</span>
          <span className="mmh-slip-info-value">
            {date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} Time: {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="mmh-slip-section-title">Patient Information</div>
        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">Name:</span>
          <span className="mmh-slip-info-value">{dispense.patient?.name || 'Walk-in Patient'}</span>
        </div>
        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">MR#:</span>
          <span className="mmh-slip-info-value">{dispense.patient?.mrNumber || 'N/A'}</span>
        </div>
        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">Details:</span>
          <span className="mmh-slip-info-value">{dispense.patient?.age || '-'} years | {dispense.patient?.gender || '-'}</span>
        </div>
        <div className="mmh-slip-info-row">
          <span className="mmh-slip-info-label">Phone:</span>
          <span className="mmh-slip-info-value">{dispense.patient?.phone || 'N/A'}</span>
        </div>

        <div className="mmh-slip-section-title">Medicines Dispensed</div>
        {dispense.items?.map((item, idx) => (
          <div key={idx} className="mmh-slip-medicine-item">
            <div className="mmh-slip-medicine-name">{item.medicineName}</div>
            <div className="mmh-slip-medicine-detail">
              <span>Qty: {item.quantity} {item.unit}(s) × PKR {item.pricePerUnit}</span>
              <span className="mmh-slip-medicine-price">= {item.totalPrice}</span>
            </div>
          </div>
        ))}

        <div className="mmh-slip-total-box">
          <span className="mmh-slip-total-label">TOTAL AMOUNT:</span>
          <span className="mmh-slip-total-amount">PKR {dispense.totalAmount}</span>
        </div>

        <div className="mmh-slip-info-row" style={{ marginTop: '12px' }}>
          <span className="mmh-slip-info-label">Dispensed by:</span>
          <span className="mmh-slip-info-value">{dispense.dispensedBy?.name} ({dispense.dispensedBy?.role})</span>
        </div>
        {dispense.notes && (
          <div className="mmh-slip-info-row">
            <span className="mmh-slip-info-label">Notes:</span>
            <span className="mmh-slip-info-value">{dispense.notes}</span>
          </div>
        )}

        <div className="mmh-slip-footer">
          Please keep this slip safe<br />
          MMH Pharmacy · Chiniot
        </div>
      </div>
    </div>
  );
};

export default DispensingSlip;
