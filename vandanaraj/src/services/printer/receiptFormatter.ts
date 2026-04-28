import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { fetchLogoBase64 } from './logoHelper';

type PrinterLike = {
    printText: (text: string) => Promise<void> | void;
    printPic?: (base64: string, opts?: any) => Promise<void> | void;
    printImage?: (url: string, opts?: any) => Promise<void> | void;
    printImageBase64?: (base64: string, opts?: any) => Promise<void> | void;
    printQRCode?: (content: string) => Promise<void> | void;
};

export const receiptFormatter = {
    async formatAndPrint(payload: any, printer: PrinterLike = BLEPrinter) {
        const data = payload?.data || [];
        console.log('[ReceiptFormatter] V3.0 Processing dynamic entries:', data.length);

        const lineWidth = Math.max(20, Math.min(48, Number(payload?.item_length) || 32));
        const divider = '-'.repeat(lineWidth);

        const safeText = (val: any) =>
            val === null || val === undefined ? '' : String(val);

        // ASYNC HELPERS: Force strictly sequential printing
        const printCentered = async (text: string) => {
            const trimmed = safeText(text).trim();
            if (!trimmed) return;
            const padTotal = Math.max(lineWidth - trimmed.length, 0);
            const left = Math.floor(padTotal / 2);
            const right = padTotal - left;
            await printer.printText(' '.repeat(left) + trimmed + ' '.repeat(right) + '\n');
        };

        const printLeftRight = async (left: string, right: string) => {
            const l = safeText(left).trim();
            const r = safeText(right).trim();
            const space = Math.max(lineWidth - l.length - r.length, 1);
            await printer.printText(l + ' '.repeat(space) + r + '\n');
        };

        const printColumns = async (col1: string, col2: string, col3?: string, col4?: string) => {
            const w1 = Math.floor(lineWidth * 0.3);
            const w2 = Math.floor(lineWidth * 0.2);
            const w3 = Math.floor(lineWidth * 0.2);
            const w4 = lineWidth - (w1 + w2 + w3 + 3);
            const c1 = safeText(col1).slice(0, w1).padEnd(w1, ' ');
            const c2 = safeText(col2).slice(0, w2).padStart(w2, ' ');
            const c3 = col3 !== undefined ? safeText(col3).slice(0, w3).padStart(w3, ' ') : '';
            const c4 = col4 !== undefined ? safeText(col4).slice(0, w4).padStart(w4, ' ') : '';
            await printer.printText(`${c1} ${c2}${c3 ? ' ' + c3 : ''}${c4 ? ' ' + c4 : ''}\n`);
        };

        // Handlers for each section type; order follows incoming JSON
        const handlers: Record<string, (payloadData: any, rawValue: string) => Promise<void>> = {
            // HEADER: centered block (title, bill/date/ticket and related lines)
            header: async (payloadData) => {
                const align = (payloadData.align || payloadData.alignment || 'center').toLowerCase();
                const print = async (text: string) => {
                    const t = safeText(text).trim();
                    if (!t) return;
                    if (align === 'left') await printer.printText(`${t}\n`);
                    else if (align === 'right') await printLeftRight('', t);
                    else await printCentered(t);
                };

                const topTitle = payloadData.top_title || payloadData.title || '';
                const billNo = payloadData.bill_no || payloadData.invoice || '';
                const date = payloadData.date_of_bill || payloadData.date || '';
                const ticketNo = payloadData.ticket_no || '';
                const subTitles: string[] = Array.isArray(payloadData.sub_titles) ? payloadData.sub_titles : [];
                const addressLines: string[] = Array.isArray(payloadData.address) ? payloadData.address : [];
                const time = payloadData.time || '';
                const employee = payloadData.employee || '';
                const till = payloadData.till || '';
                const orderType = payloadData.order_type || '';
                const customerName = payloadData.customer_name || '';
                const customerPhone = payloadData.customer_phone || '';
                const customerAddress: string[] = Array.isArray(payloadData.customer_address) ? payloadData.customer_address : [];
                const customerRemarks: string[] = Array.isArray(payloadData.customer_remarks) ? payloadData.customer_remarks : [];
                const headerComments: string[] = Array.isArray(payloadData.headercomments) ? payloadData.headercomments : [];
                // Build an ordered list so header always prints in the intended order
                const headerLines: string[] = [];
                if (topTitle) headerLines.push(topTitle);
                if (billNo) headerLines.push(`Bill No: ${billNo}`);
                if (date || time) headerLines.push([date, time].filter(Boolean).join(' '));
                if (ticketNo) headerLines.push(`Ticket: ${ticketNo}`);
                headerLines.push(...subTitles);
                headerLines.push(...addressLines);
                if (orderType) headerLines.push(orderType);
                if (employee || till) headerLines.push([employee, till].filter(Boolean).join(' | '));
                if (customerName) headerLines.push(customerName);
                if (customerPhone) headerLines.push(customerPhone);
                headerLines.push(...customerAddress);
                headerLines.push(...customerRemarks);
                headerLines.push(...headerComments);

                for (const line of headerLines) {
                    await print(line);
                }
            },

            // SEPARATOR: driven by JSON char/count; no hardcoding
            separator: async (payloadData) => {
                const char = payloadData?.char || '-';
                const count = Number(payloadData?.count) || Number(payloadData?.separator_length);
                const useCount = count ? Math.max(4, count) : lineWidth;
                const line = char.repeat(useCount).slice(0, lineWidth);
                await printer.printText(line + '\n');
            },

            // ITEM LIST: table header + items
            item: async (payloadData, value) => {
                const items = Array.isArray(payloadData.itemdata)
                    ? payloadData.itemdata
                    : Array.isArray(payloadData.items)
                        ? payloadData.items
                        : [payloadData];

                const nameWidth = Math.floor(lineWidth * 0.5);
                const qtyWidth = Math.max(3, Math.floor(lineWidth * 0.15));
                const priceWidth = lineWidth - (nameWidth + qtyWidth + 2);

                const formatLine = (n: string, q: string, p: string) => {
                    const sn = safeText(n).slice(0, nameWidth).padEnd(nameWidth, ' ');
                    const sq = safeText(q).slice(0, qtyWidth).padStart(qtyWidth, ' ');
                    const sp = safeText(p).slice(0, priceWidth).padStart(priceWidth, ' ');
                    return `${sn} ${sq} ${sp}`;
                };

                const lines: string[] = [];
                lines.push(formatLine('Item', 'Qty', 'Price')); // table header always first
                for (const row of items) {
                    const name = safeText(row?.item_name || row?.name || row?.title || value);
                    const qty = safeText(row?.quantity || row?.qty || '1');
                    const price = safeText(row?.price || row?.item_amount || row?.amount || '');
                    lines.push(formatLine(name, qty, price));

                    const subLine = safeText((row as any)?.item_subLine || (row as any)?.subLine || '');
                    if (subLine) lines.push(`  ${subLine}`);

                    // Process toppings/extras
                    const toppings: string[] = Array.isArray(row?.toppings) ? row.toppings : [];
                    const toppingsWithPrice: string[] = Array.isArray((row as any)?.toppings_with_price) ? (row as any)?.toppings_with_price : [];
                    const nestedItems: any[] = Array.isArray((row as any)?.items) ? (row as any)?.items : [];
                    const remarks = safeText((row as any)?.customer_remarks || '');

                    for (const t of toppings) lines.push(`  ${safeText(t)}`);
                    for (const t of toppingsWithPrice) lines.push(`  ${safeText(t)}`);
                    for (const ni of nestedItems) {
                        const niName = safeText(ni?.item_name || ni?.name || ni?.title || ni);
                        if (niName) lines.push(`  ${niName}`);
                    }
                    if (remarks) lines.push(`  ${remarks}`);
                }
                // Print the whole item block in one go to keep order intact
                await printer.printText(lines.join('\n') + '\n');
            },

            // BIG SUMMARY: totals aligned (label left, value right)
            bigsummary: async (payloadData, value) => {
                const summaryRows = Array.isArray(payloadData.bigsummary)
                    ? payloadData.bigsummary
                    : Array.isArray(payloadData.summary)
                        ? payloadData.summary
                        : value ? [{ key: 'Total', value }] : [];

                const labelWidth = Math.floor(lineWidth * 0.6);
                const valWidth = lineWidth - labelWidth;

                for (const row of summaryRows) {
                    const label = safeText(row?.key || row?.label || row?.title || 'TOTAL');
                    const totalVal = safeText(row?.value || row?.amount || row?.total || '');
                    const L = label.slice(0, labelWidth).padEnd(labelWidth, ' ');
                    const V = totalVal.slice(0, valWidth).padStart(valWidth, ' ');
                    await printer.printText(`${L}${V}\n`);
                }
            },

            // SUMMARY: reuse bigsummary formatting
            summary: async (payloadData, value) => {
                const handler = handlers.bigsummary;
                if (handler) await handler(payloadData, value);
            },

            // COLUMN DETAILS: generic column header/rows (e.g., tax table)
            columndetails: async (payloadData) => {
                const header = payloadData.columnheader || {};
                const rows: any[] = Array.isArray(payloadData.columndata) ? payloadData.columndata : [];
                const h1 = safeText(header.column1 || ''); const h2 = safeText(header.column2 || '');
                const h3 = safeText(header.column3 || ''); const h4 = safeText(header.column4 || '');
                if (h1 || h2 || h3 || h4) await printColumns(h1, h2, h3, h4);
                for (const r of rows) {
                    await printColumns(r.column1 || '', r.column2 || '', r.column3 || '', r.column4 || '');
                }
            },

            // RECEIPT TEXT: plain lines
            receipt: async (payloadData) => {
                const lines: string[] = Array.isArray(payloadData.receipt_text) ? payloadData.receipt_text : [];
                for (const ln of lines) await printer.printText(`${safeText(ln)}\n`);
            },

            // FOOTER: footer_text with JSON alignment
            footer: async (payloadData, rawValue) => {
                const footerAlign = (payloadData.align || payloadData.alignment || 'center').toLowerCase();
                const footerTexts: string[] = Array.isArray(payloadData.footer_text)
                    ? payloadData.footer_text
                    : rawValue ? [rawValue] : [];

                for (const line of footerTexts) {
                    const l = safeText(line).trim();
                    if (!l) continue;
                    if (footerAlign === 'right') await printLeftRight('', l);
                    else if (footerAlign === 'left') await printer.printText(`${l}\n`);
                    else await printCentered(l);
                }
            },

            // TEXT: plain text line
            text: async (_payloadData, rawValue) => {
                await printer.printText(`${safeText(rawValue)}\n`);
            },

            // LINE: dashed divider
            line: async () => {
                await printer.printText(divider + '\n');
            },

            // LOGO: URL/base64, converted to image and sent to printer
            logo: async (payloadData, rawValue) => {
                const logoSource = payloadData?.url || payloadData?.base64 || payloadData?.data || rawValue;
                if (!logoSource) return;
                const width = payloadData.width !== undefined ? Number(payloadData.width) : 380;
                const height = payloadData.height !== undefined ? Number(payloadData.height) : undefined;

                const runLogo = async () => {
                    const base64 =
                        typeof logoSource === 'string' && logoSource.startsWith('data:')
                            ? logoSource.split(',')[1]
                            : typeof logoSource === 'string' && logoSource.length > 100 && !logoSource.startsWith('http')
                                ? logoSource
                                : await fetchLogoBase64(String(logoSource));

                    // Prefer printPic (BLE), fallback to printImageBase64/printImage if available
                    if (base64 && printer.printPic) {
                        await printer.printPic(base64, { imageWidth: width });
                    } else if (base64 && printer.printImageBase64) {
                        await printer.printImageBase64(base64, { imageWidth: width, imageHeight: height });
                    } else if (logoSource && printer.printImage && typeof logoSource === 'string') {
                        await printer.printImage(logoSource, { imageWidth: width, imageHeight: height });
                    }
                };

                try {
                    await Promise.race([
                        runLogo(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Logo Timeout')), 12000)),
                    ]);
                } catch (err) {
                    console.warn('[ReceiptFormatter] Logo failed or timed out:', err);
                }
            },

            image: async (payloadData, rawValue) => {
                const handler = handlers.logo;
                if (handler) await handler(payloadData, rawValue);
            },

            qr: async (_payloadData, rawValue) => {
                if (rawValue && printer.printQRCode) {
                    await printer.printQRCode(rawValue);
                }
            },
        };

        // PROCESS ALL ITEMS IN ORDER
        for (const item of data) {
            try {
                const type = (item.type || '').toLowerCase().trim();
                const payloadData = item.data || {};
                const value = item.value || item.content || item.text || item.name || item.title || item.label || '';
                const handler = handlers[type];

                if (handler) {
                    console.log(`[ReceiptFormatter] Awaiting handler: ${type}`);
                    await handler(payloadData, value);
                } else if (value) {
                    await printer.printText(`${value}\n`);
                }
            } catch (err) {
                console.warn('[ReceiptFormatter] Item error:', item, err);
            }
        }
    },

    async printMinimalTest() {
        await BLEPrinter.printText('<C><b>TEST PRINT</b></C>\n');
        await BLEPrinter.printText('<C>Success</C>\n');
        await BLEPrinter.printText('<C>' + new Date().toLocaleTimeString() + '</C>\n');
    },

    async feedAndCut(printer: PrinterLike = BLEPrinter) {
        try {
            await printer.printText('\n\n\n\n\n');
            await printer.printText('\x1d\x56\x42\x00');
        } catch (err) {
            console.warn('[ReceiptFormatter] feedAndCut failed', err);
        }
    }
};
