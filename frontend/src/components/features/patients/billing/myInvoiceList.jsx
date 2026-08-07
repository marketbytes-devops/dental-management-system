export default function MyInvoiceList({ invoices = [], activeTab = "bills", patientDetails, onSelectInvoice, onPayInvoice }) {
  const generateInvoiceHtml = (inv, includeHtmlShell = true) => {
    const isConsultation = activeTab === "consultations";
    const invoiceTitle = isConsultation ? "Consultation Receipt" : "Treatment Invoice";
    
    const innerHtml = `
      <div class="max-w-3xl mx-auto bg-white p-6 shadow-sm border border-gray-200 rounded-xl" id="invoice-content-${inv.id}">
        
        <!-- Header -->
        <div class="flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
          <div>
            <h1 class="text-3xl font-extrabold text-blue-600 tracking-tight">SmileCare</h1>
            <p class="text-sm text-gray-500 font-medium mt-1">Dental Clinic</p>
            <div class="mt-4 text-xs text-gray-500 space-y-1">
              <p>123 Smile Avenue, Dental District</p>
              <p>City, State, 12345</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: hello@smilecaredental.com</p>
            </div>
          </div>
          <div class="text-right">
            <h2 class="text-2xl font-bold text-gray-800 uppercase tracking-wider">${invoiceTitle}</h2>
            <p class="text-sm font-semibold text-gray-600 mt-2"># ${inv.id}</p>
            <p class="text-xs text-gray-500 mt-1">Date: ${inv.date}</p>
            <div class="mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
              STATUS: ${inv.status.toUpperCase()}
            </div>
          </div>
        </div>

        <!-- Patient Details -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500 text-xs">Patient Name</p>
              <p class="font-bold text-gray-900">${patientDetails?.name || 'N/A'}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Patient ID</p>
              <p class="font-semibold text-gray-900">${patientDetails?.token || 'N/A'}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Phone Number</p>
              <p class="font-semibold text-gray-900">${patientDetails?.phone || 'N/A'}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Attending Doctor</p>
              <p class="font-semibold text-gray-900">${inv.doctor || 'Clinic Staff'}</p>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="mb-6">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-2/3">Description</th>
                <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-1/3">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr>
                <td class="py-4 px-4 text-sm font-semibold text-gray-800">${inv.treatment}</td>
                <td class="py-4 px-4 text-sm font-bold text-gray-900 text-right">₹${inv.gross?.toLocaleString("en-IN") || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="flex justify-end mb-6">
          <div class="w-1/2 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <div class="flex justify-between items-center mb-3 text-sm">
              <span class="text-gray-500">Subtotal</span>
              <span class="font-semibold">₹${inv.gross?.toLocaleString("en-IN") || '0'}</span>
            </div>
            ${!isConsultation ? `
            <div class="flex justify-between items-center mb-3 text-sm">
              <span class="text-gray-500">Insurance Paid</span>
              <span class="font-semibold text-green-600">- ₹${inv.insurancePaid?.toLocaleString("en-IN") || '0'}</span>
            </div>
            ` : ''}
            <div class="flex justify-between items-center pt-3 border-t border-gray-200">
              <span class="font-bold text-gray-900 uppercase tracking-wider text-sm">Net Due</span>
              <span class="font-extrabold text-xl text-blue-600">₹${(isConsultation ? inv.gross : inv.patientDue)?.toLocaleString("en-IN") || '0'}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
          <p class="font-semibold text-gray-500 mb-1">Thank you for trusting SmileCare Dental Clinic!</p>
          <p>Please contact us at hello@smilecaredental.com for any queries regarding this invoice.</p>
        </div>

      </div>
    `;

    if (!includeHtmlShell) return innerHtml;

    return `
      <html>
        <head>
          <title>${invoiceTitle} - ${inv.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 p-8 font-sans antialiased text-gray-900" onload="setTimeout(() => window.print(), 500)">
          ${innerHtml}
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">{activeTab === "consultations" ? "Consultation Receipts" : "Invoices & Statements"}</h3>
      </div>

      <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">{activeTab === "consultations" ? "Receipt ID" : "Invoice ID"}</th>
                <th className="p-4">Date</th>
                <th className="p-4">{activeTab === "consultations" ? "Consultation Type" : "Treatment"}</th>
                <th className="p-4 text-right">{activeTab === "consultations" ? "Amount Paid" : "Gross Amount"}</th>
                {activeTab !== "consultations" && <th className="p-4 text-right">Insurance Paid</th>}
                {activeTab !== "consultations" && <th className="p-4 text-right">Net Due</th>}
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-950">{inv.id}</td>
                  <td className="p-4 whitespace-nowrap">{inv.date}</td>
                  <td className="p-4 font-semibold text-gray-900">{inv.treatment}</td>
                  <td className="p-4 text-right">₹{inv.gross.toLocaleString("en-IN")}</td>
                  {activeTab !== "consultations" && <td className="p-4 text-right text-success-800">₹{inv.insurancePaid.toLocaleString("en-IN")}</td>}
                  {activeTab !== "consultations" && <td className="p-4 text-right font-extrabold text-gray-900">₹{inv.patientDue.toLocaleString("en-IN")}</td>}
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${inv.status === "Paid"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                        }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        const htmlContent = generateInvoiceHtml(inv, true);
                        const printIframe = document.createElement('iframe');
                        printIframe.style.position = 'absolute';
                        printIframe.style.top = '-9999px';
                        document.body.appendChild(printIframe);
                        
                        const iframeDoc = printIframe.contentWindow.document;
                        iframeDoc.open();
                        iframeDoc.write(htmlContent);
                        iframeDoc.close();
                        
                        setTimeout(() => {
                          printIframe.contentWindow.focus();
                          printIframe.contentWindow.print();
                          setTimeout(() => document.body.removeChild(printIframe), 1000);
                        }, 500);
                      }}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      title="Print Invoice"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        const printIframe = document.createElement('iframe');
                        printIframe.style.position = 'absolute';
                        printIframe.style.top = '-9999px';
                        printIframe.style.width = '800px';
                        printIframe.style.height = '1100px';
                        document.body.appendChild(printIframe);
                        
                        const iframeDoc = printIframe.contentWindow.document;
                        iframeDoc.open();
                        
                        const scriptContent = `
                          <html>
                            <head>
                              <title>Invoice</title>
                              <script src="https://cdn.tailwindcss.com"></script>
                              <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                            </head>
                            <body class="bg-gray-50 p-8 font-sans antialiased text-gray-900">
                              ${generateInvoiceHtml(inv, false)}
                              <script>
                                setTimeout(() => {
                                  const element = document.body.children[0];
                                  const opt = {
                                    margin:       0.5,
                                    filename:     'invoice_${inv.id}.pdf',
                                    image:        { type: 'jpeg', quality: 0.98 },
                                    html2canvas:  { scale: 2, useCORS: true },
                                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                                  };
                                  window.html2pdf().set(opt).from(element).save().then(() => {
                                    window.parent.postMessage({ type: 'pdfDone', id: '${inv.id}' }, '*');
                                  });
                                }, 1500); // Give Tailwind time to render
                              </script>
                            </body>
                          </html>
                        `;
                        iframeDoc.write(scriptContent);
                        iframeDoc.close();
                        
                        const listener = (event) => {
                          if (event.data?.type === 'pdfDone' && event.data?.id === String(inv.id)) {
                            document.body.removeChild(printIframe);
                            window.removeEventListener('message', listener);
                          }
                        };
                        window.addEventListener('message', listener);
                      }}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      title="Download Invoice"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    {inv.status !== "Paid" && activeTab !== "consultations" && (
                      <button
                        onClick={() => onPayInvoice(inv)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 ml-2"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
