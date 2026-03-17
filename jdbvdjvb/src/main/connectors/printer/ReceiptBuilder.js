/**
 * ReceiptBuilder.js
 * Pure receipt line/HTML/plain-text generation — no I/O, no Electron dependencies.
 * Extracted from PrintConnector.js so every print path shares a single source of truth.
 */
const QRCode = require('qrcode');
const log = require('../../../logger');

/* ---------- QR code SVG generator (sync) ---------- */
function generateQRSVG(data) {
  try {
    var qr = QRCode.create(String(data || ''), { errorCorrectionLevel: 'M' });
    var size = qr.modules.size;
    var modules = qr.modules.data;
    var cellSize = 4;
    var margin = cellSize;
    var total = size * cellSize + margin * 2;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + total + '" height="' + total + '" viewBox="0 0 ' + total + ' ' + total + '">';
    svg += '<rect width="' + total + '" height="' + total + '" fill="white"/>';
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (modules[y * size + x]) {
          svg += '<rect x="' + (margin + x * cellSize) + '" y="' + (margin + y * cellSize) + '" width="' + cellSize + '" height="' + cellSize + '" fill="black"/>';
        }
      }
    }
    svg += '</svg>';
    return svg;
  } catch (err) {
    log.error('[ReceiptBuilder] QR code generation failed:', err);
    return '';
  }
}

/* ---------- Code 128 barcode SVG generator ---------- */
function generateCode128SVG(data) {
  var PATTERNS = [
    '11011001100','11001101100','11001100110','10010011000','10010001100',
    '10001001100','10011001000','10011000100','10001100100','11001001000',
    '11001000100','11000100100','10110011100','10011011100','10011001110',
    '10111001100','10011101100','10011100110','11001110010','11001011100',
    '11001001110','11011100100','11001110100','11101101110','11101001100',
    '11100101100','11100100110','11101100100','11100110100','11100110010',
    '11011011000','11011000110','11000110110','10100011000','10001011000',
    '10001000110','10110001000','10001101000','10001100010','11010001000',
    '11000101000','11000100010','10110111000','10110001110','10001101110',
    '10111011000','10111000110','10001110110','11101110110','11010001110',
    '11000101110','11011101000','11011100010','11011101110','11101011000',
    '11101000110','11100010110','11101101000','11101100010','11100011010',
    '11101111010','11001000010','11110001010','10100110000','10100001100',
    '10010110000','10010000110','10000101100','10000100110','10110010000',
    '10110000100','10011010000','10011000010','10000110100','10000110010',
    '11000010010','11001010000','11110111010','11000010100','10001111010',
    '10100111100','10010111100','10010011110','10111100100','10011110100',
    '10011110010','11110100100','11110010100','11110010010','11011011110',
    '11011110110','11110110110','10101111000','10100011110','10001011110',
    '10111101000','10111100010','11110101000','11110100010','10111011110',
    '10111101110','11101011110','11110101110',
    '11010000100','11010010000','11010011100','1100011101011'
  ];
  var str = String(data || '');
  if (!str.length) return '';
  var codes = [104]; // Start B
  var checksum = 104;
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i) - 32;
    if (code < 0 || code > 95) code = 0;
    codes.push(code);
    checksum += code * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(106); // Stop
  var binary = '';
  for (var c = 0; c < codes.length; c++) {
    binary += PATTERNS[codes[c]];
  }
  var barW = 2;
  var h = 50;
  var w = binary.length * barW;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
  svg += '<rect width="' + w + '" height="' + h + '" fill="white"/>';
  for (var b = 0; b < binary.length; b++) {
    if (binary[b] === '1') {
      svg += '<rect x="' + (b * barW) + '" y="0" width="' + barW + '" height="' + h + '" fill="black"/>';
    }
  }
  svg += '</svg>';
  return svg;
}

/* ---------- utils ---------- */
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function isNum(v) { const n = Number(v); return Number.isFinite(n); }
function money(v) { return isNum(v) ? Number(v).toFixed(2) : '0.00'; }

/* ---------- Shared line builder used by both modes ---------- */
function buildReceiptLines(payload, options = {}) {
  var kitchenMode = options.kitchenMode === true;
  var blocks = Array.isArray(payload && payload.data) ? payload.data : [];
  var lines = [];
  var boldLineIndices = {};
  var lineStyles = {};
  var imageInserts = {};
  var topTitle = "";
  var headerRemarks = [];
  var headerRemarksStyle = {};
  var suppressedKitchenTypes = new Set(["summary", "bigsummary", "footer", "columndetails"]);
  var kitchenRightMargin = 2;

  var lineWidth = Number(payload && payload.item_length) || 42;
  var qtyWidth = 3;
  var priceWidth = 7;
  var colGap = 1;
  var fixedCols = 1 + qtyWidth + colGap + priceWidth;
  var nameWidth = Math.max(8, lineWidth - fixedCols);

  function centerText(text) {
    var str = String(text || "").trim();
    if (str.length >= lineWidth) return str;
    var pad = Math.floor((lineWidth - str.length) / 2);
    return " ".repeat(pad) + str;
  }

  function pushCentered(text) {
    if (text == null) return;
    var str = String(text).trim();
    if (str.length) lines.push(centerText(str));
  }

  function pushLine(text) {
    if (text == null) return;
    var value = String(text).trim();
    if (value.length) lines.push(value);
  }

  function wrapAndPush(prefix, text) {
    var raw = String(text || "");
    if (!raw.length) return;
    var available = lineWidth - prefix.length;
    if (available <= 4) {
      lines.push((prefix + raw).slice(0, lineWidth));
      return;
    }
    var remaining = raw;
    var first = true;
    while (remaining.length) {
      var chunk = remaining.slice(0, available);
      remaining = remaining.slice(available);
      if (first) {
        lines.push(prefix + chunk);
        first = false;
      } else {
        lines.push("".padEnd(prefix.length, " ") + chunk);
      }
    }
  }

  function wrapItemLine(nameText, qtyText, amountText, opts) {
    var isKitchen = opts && opts.kitchenMode;
    if (isKitchen) {
      var rightMargin = kitchenRightMargin;
      var qtyLen = qtyText.length;
      var avail = Math.max(1, lineWidth - rightMargin - qtyLen - 1);
      var remaining = String(nameText || "");
      var first = true;
      while (remaining.length) {
        var chunk = remaining.slice(0, avail);
        remaining = remaining.slice(avail);
        if (first) {
          var gap = Math.max(1, lineWidth - rightMargin - chunk.length - qtyLen);
          lines.push(chunk + " ".repeat(gap) + qtyText);
          first = false;
        } else {
          lines.push(chunk);
        }
      }
    } else {
      var gapStr = " ".repeat(colGap);
      var availCash = nameWidth;
      var remainingCash = String(nameText || "");
      var firstCash = true;
      while (remainingCash.length) {
        var chunkCash = remainingCash.slice(0, availCash);
        remainingCash = remainingCash.slice(availCash);
        if (firstCash) {
          lines.push(
            chunkCash.padEnd(nameWidth, " ") + " " +
            qtyText.padStart(qtyWidth, " ") + gapStr +
            amountText.padStart(priceWidth, " ")
          );
          firstCash = false;
        } else {
          lines.push(chunkCash);
        }
      }
    }
  }

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var type = block && block.type;
    var d = (block && block.data) || {};
    var prevType = i > 0 && blocks[i - 1] ? blocks[i - 1].type : null;
    var nextType = i + 1 < blocks.length && blocks[i + 1] ? blocks[i + 1].type : null;

    if (type === "header") {
      if (d.top_title) {
        topTitle = d.top_title;
      }
      if (!kitchenMode) {
        if (Array.isArray(d.customer_remarks)) {
          headerRemarks = d.customer_remarks;
          headerRemarksStyle = { length: d.customer_remarks_length, italic: d.customer_remarks_italic, bold: d.customer_remarks_bold };
        }
        (d.sub_titles || []).forEach(function(t) { pushCentered(t); });
      (d.address || []).forEach(function(a) { pushCentered(a); });
      if (Array.isArray(d.customer_address)) {
        d.customer_address.forEach(function(addr) {
          wrapAndPush("", addr);
        });
      }
        if (d.bill_no) pushCentered("Bill No: " + d.bill_no);
        if (d.ticket_no) pushCentered("Ticket: " + d.ticket_no);
        if (d.date_of_bill || d.time) {
          pushCentered([d.date_of_bill, d.time].filter(Boolean).join(" "));
        }
        if (d.order_type) pushCentered("Order Type: " + d.order_type);
        if (d.employee) pushCentered("Employee: " + d.employee);
        if (d.till) pushCentered("Till: " + d.till);
      } else {
        if (Array.isArray(d.customer_remarks)) {
          headerRemarks = d.customer_remarks;
          headerRemarksStyle = { length: d.customer_remarks_length, italic: d.customer_remarks_italic, bold: d.customer_remarks_bold };
        }
      }
    }

    if (type === "separator") {
      if (kitchenMode && (suppressedKitchenTypes.has(prevType) || suppressedKitchenTypes.has(nextType))) {
        continue;
      }
      var len = Number(d.separator_length) || lineWidth;
      lines.push("-".repeat(Math.max(4, len)));
    }

    if (type === "item" && Array.isArray(d.itemdata)) {
      var gapStr = " ".repeat(colGap);

      var headerStyle = "0";
      if (d.itemdata.length > 0 && d.itemdata[0].item_header_style != null) {
        headerStyle = String(d.itemdata[0].item_header_style);
      }

      var headerLineIdx = lines.length;
      if (kitchenMode) {
        var qtyTitle = "Qty";
        var itemTitle = "Item";
        var gapTitle = Math.max(1, lineWidth - kitchenRightMargin - itemTitle.length - qtyTitle.length);
        lines.push(itemTitle + " ".repeat(gapTitle) + qtyTitle);
      } else {
        lines.push(
          "Item".padEnd(nameWidth, " ") + " " +
          "Qty".padStart(qtyWidth, " ") + gapStr +
          "Price".padStart(priceWidth, " ")
        );
      }
      if (headerStyle !== "0") {
        boldLineIndices[headerLineIdx] = true;
      }

      for (var k = 0; k < d.itemdata.length; k++) {
        var item = d.itemdata[k];

        if (item.menu_group) {
          var mgParts = String(item.menu_group).split("~");
          var mgName = mgParts[0] || "";
          var mgDisc = mgParts[1] ? " (" + mgParts[1] + "%)" : "";
          if (mgName) {
            lines.push("-- " + mgName + mgDisc + " --");
          }
        }

        var qty = isNum(item.quantity) ? Number(item.quantity) : 1;
        var rawName = item.item_name || "";
        var amount = money(isNum(item.item_amount) ? item.item_amount : item.price);
        var qtyStr = String(qty);
        wrapItemLine(String(rawName || ""), qtyStr, amount, { kitchenMode });

        if (Array.isArray(item.toppings) && item.toppings.length > 0) {
          wrapAndPush("  + ", item.toppings.join(", "));
        }
        if (Array.isArray(item.toppings_with_price) && item.toppings_with_price.length > 0) {
          wrapAndPush("  + ", item.toppings_with_price.join(", "));
        }
        if (item.custpmer_remarks) {
          var itemRemarkStart = lines.length;
          wrapAndPush("  # ", String(item.custpmer_remarks));
          var itemRemarkStyle = { length: item.custpmer_remarks_Length, bold: item.custpmer_remarks_bold };
          for (var ri = itemRemarkStart; ri < lines.length; ri++) {
            lineStyles[ri] = itemRemarkStyle;
          }
        }

        if (Array.isArray(item.items)) {
          for (var si = 0; si < item.items.length; si++) {
            var sub = item.items[si];
            var subName = sub.item_name || "";
            var subQty = isNum(sub.quantity) ? Number(sub.quantity) : 1;
            var subLine = "  > " + subName;
            if (subQty > 1) subLine += " x" + subQty;
            if (subLine.length > lineWidth) subLine = subLine.slice(0, lineWidth);
            lines.push(subLine);

            if (Array.isArray(sub.toppings) && sub.toppings.length > 0) {
              wrapAndPush("    + ", sub.toppings.join(", "));
            }
            if (Array.isArray(sub.toppings_with_price) && sub.toppings_with_price.length > 0) {
              wrapAndPush("    + ", sub.toppings_with_price.join(", "));
            }
            if (sub.custpmer_remarks) {
              var subRemarkStart = lines.length;
              wrapAndPush("    # ", String(sub.custpmer_remarks));
              var subRemarkStyle = { length: sub.custpmer_remarks_Length, bold: sub.custpmer_remarks_bold };
              for (var sri = subRemarkStart; sri < lines.length; sri++) {
                lineStyles[sri] = subRemarkStyle;
              }
            }
          }
        }
      }
    }

    if (type === "columndetails" && d.columnheader) {
      if (kitchenMode) continue;
      var cols = [];
      if (d.columnheader.column1) cols.push("column1");
      if (d.columnheader.column2) cols.push("column2");
      if (d.columnheader.column3) cols.push("column3");
      if (d.columnheader.column4) cols.push("column4");

      var colCount = cols.length;
      var colW = Math.floor(lineWidth / colCount);

      var chLine = "";
      for (var ch = 0; ch < cols.length; ch++) {
        var chText = String(d.columnheader[cols[ch]] || "");
        if (ch === cols.length - 1) {
          chLine += chText.padStart(lineWidth - chLine.length, " ");
        } else {
          chLine += chText.padEnd(colW, " ");
        }
      }
      lines.push(chLine);

      if (Array.isArray(d.columndata)) {
        for (var cd = 0; cd < d.columndata.length; cd++) {
          var row = d.columndata[cd];
          var cdLine = "";
          for (var cc = 0; cc < cols.length; cc++) {
            var cellText = String(row[cols[cc]] || "");
            if (cc === cols.length - 1) {
              cdLine += cellText.padStart(lineWidth - cdLine.length, " ");
            } else {
              cdLine += cellText.padEnd(colW, " ");
            }
          }
          lines.push(cdLine);
        }
      }
    }

    if (type === "summary" && Array.isArray(d.summary)) {
      if (kitchenMode) continue;
      for (var s = 0; s < d.summary.length; s++) {
        var sKey = String(d.summary[s].key || "");
        var sVal = money(d.summary[s].value);
        var sGap = Math.max(1, lineWidth - sKey.length - sVal.length);
        lines.push(sKey + " ".repeat(sGap) + sVal);
      }
    }

    if (type === "bigsummary" && Array.isArray(d.bigsummary)) {
      if (kitchenMode) continue;
      for (var b = 0; b < d.bigsummary.length; b++) {
        var bKey = String(d.bigsummary[b].key || "");
        var bVal = money(d.bigsummary[b].value);
        var bGap = Math.max(1, lineWidth - bKey.length - bVal.length);
        lines.push(bKey + " ".repeat(bGap) + bVal);
      }
      if (Array.isArray(headerRemarks) && headerRemarks.length > 0) {
        lines.push("");
        headerRemarks.forEach(function(r) {
          var text = String(r || "").trim();
          if (text.length) {
            lines.push(text);
            lineStyles[lines.length - 1] = headerRemarksStyle;
          }
        });
      }
    }

    if (type === "footer" && Array.isArray(d.footer_text)) {
      if (kitchenMode) continue;
      var align = (d.align || "center").toLowerCase();
      for (var f = 0; f < d.footer_text.length; f++) {
        if (align === "center") {
          pushCentered(d.footer_text[f]);
        } else if (align === "right") {
          var rStr = String(d.footer_text[f] || "").trim();
          lines.push(rStr.padStart(lineWidth, " "));
        } else {
          pushLine(d.footer_text[f]);
        }
      }
    }

    if (type === "Qr" && d.qr_data) {
      if (kitchenMode) continue;
      lines.push("");
      imageInserts[lines.length - 1] = { type: 'qr', data: String(d.qr_data), align: d.align || 'center' };
    }

    if (type === "barcode" && d.barcode_data) {
      if (kitchenMode) continue;
      lines.push("");
      imageInserts[lines.length - 1] = { type: 'barcode', data: String(d.barcode_data), align: d.align || 'center' };
    }
  }

  // If kitchen mode and we had header-level remarks, append them at the end
  if (kitchenMode && Array.isArray(headerRemarks) && headerRemarks.length > 0) {
    lines.push("");
    headerRemarks.forEach(function(r) {
      var text = String(r || "").trim();
      if (text.length) {
        lines.push(text);
        lineStyles[lines.length - 1] = headerRemarksStyle;
      }
    });
  }

  lines.push("");
  lines.push("");
  return { lines: lines, boldLineIndices: boldLineIndices, topTitle: topTitle, lineStyles: lineStyles, imageInserts: imageInserts };
}

/* ---------- HTML builder - same alignment as text mode ---------- */
function buildReceiptHtml(payload, options = {}) {
  const kitchenMode = options.kitchenMode === true;
  var printableMm = 80;
  var leftOffsetMm = Number(payload && payload.left_offset_mm) || 0;
  var lineWidth = Number(payload && payload.item_length) || 42;

  var contentMm = printableMm - 6;
  var fontSizeMm = contentMm / (lineWidth * 0.65);

  var result = buildReceiptLines(payload, { kitchenMode });
  var textLines = result.lines;
  var boldSet = result.boldLineIndices;
  var stylesMap = result.lineStyles || {};
  var imgInserts = result.imageInserts || {};

  var blocks = Array.isArray(payload && payload.data) ? payload.data : [];
  var logoHtml = "";
  if (!kitchenMode) {
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i] && blocks[i].type === "logo" && blocks[i].data && blocks[i].data.url) {
        logoHtml = "<div class=\"logo\"><img src=\"" + escapeHtml(blocks[i].data.url) + "\" alt=\"logo\"></div>";
        break;
      }
    }
  }

  var css = "@page{size:80mm auto;margin:0}" +
    "html,body{margin:0;padding:0}" +
    "body{font-family:Courier New,monospace;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:" + fontSizeMm.toFixed(2) + "mm;background:#fff}" +
    ".paper{width:" + printableMm + "mm;margin:0;padding:3mm 2mm 3mm 4mm;transform:translateX(" + leftOffsetMm + "mm);box-sizing:border-box;overflow:hidden}" +
    ".logo{display:block;width:100%;text-align:center;margin-bottom:2mm}" +
    ".logo img{max-width:65%;max-height:20mm;height:auto;display:inline-block}" +
    ".text-content{white-space:pre;line-height:1.3}" +
    ".remark-line{white-space:pre-wrap;word-wrap:break-word;line-height:1.3;margin:0}" +
    ".top-title{text-align:center;font-weight:bold;font-size:1.8em;line-height:1.2;margin-bottom:1mm}" +
    ".qr-barcode{margin:2mm 0}.qr-barcode svg{max-width:100%;height:auto}";

  var titleHtml = result.topTitle ? "<div class=\"top-title\">" + escapeHtml(result.topTitle) + "</div>" : "";

  var html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>";
  html += "<title>Receipt</title>";
  html += "<style>" + css + "</style></head><body>";
  html += "<div class=\"paper\">";
  html += logoHtml;
  html += titleHtml;
  var inTextBlock = false;
  for (var j = 0; j < textLines.length; j++) {
    var img = imgInserts[j];
    if (img) {
      if (inTextBlock) { html += "</div>"; inTextBlock = false; }
      var imgAlign = (img.align || "center").toLowerCase();
      var imgSvg = img.type === 'qr' ? generateQRSVG(img.data) : generateCode128SVG(img.data);
      if (imgSvg) {
        html += "<div class=\"qr-barcode\" style=\"text-align:" + imgAlign + "\">" + imgSvg + "</div>";
      }
      continue;
    }
    var escaped = escapeHtml(textLines[j]);
    var ls = stylesMap[j];
    var hasSizeChange = ls && (String(ls.length || "").toLowerCase() === "large" || String(ls.length || "").toLowerCase() === "medium");

    if (hasSizeChange) {
      if (inTextBlock) { html += "</div>"; inTextBlock = false; }
      var remarkStyle = "";
      var sv = String(ls.length || "").toLowerCase();
      if (sv === "large") remarkStyle += "font-size:1.6em;";
      else if (sv === "medium") remarkStyle += "font-size:1.3em;";
      if (ls.italic) remarkStyle += "font-style:italic;";
      if (ls.bold || boldSet[j]) remarkStyle += "font-weight:bold;";
      html += "<div class=\"remark-line\" style=\"" + remarkStyle + "\">" + escaped + "</div>";
    } else {
      if (!inTextBlock) { html += "<div class=\"text-content\">"; inTextBlock = true; }
      var inlineStyle = "";
      if (ls) {
        if (ls.italic) inlineStyle += "font-style:italic;";
        if (ls.bold) inlineStyle += "font-weight:bold;";
      }
      if (boldSet[j] || (ls && ls.bold)) {
        html += (inlineStyle ? "<b style=\"" + inlineStyle + "\">" : "<b>") + escaped + "</b>\n";
      } else if (inlineStyle) {
        html += "<span style=\"" + inlineStyle + "\">" + escaped + "</span>\n";
      } else {
        html += escaped + "\n";
      }
    }
  }
  if (inTextBlock) { html += "</div>"; }
  html += "</div></body></html>";
  return html;
}

/* ---------- Plain-text wrapper ---------- */
function buildReceiptPlainText(payload, options = {}) {
  var result = buildReceiptLines(payload, options);
  return result.lines.join('\n');
}

module.exports = {
  generateQRSVG,
  generateCode128SVG,
  escapeHtml,
  isNum,
  money,
  buildReceiptLines,
  buildReceiptHtml,
  buildReceiptPlainText
};
