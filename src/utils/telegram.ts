import { Order } from '../types';

export function formatTelegramInvoice(order: Order, _isPaid = true, _hasReceipt = false): string {
  const addressParts = [
    order.customerInfo.cityProvince,
    order.customerInfo.districtSangkat,
    order.customerInfo.sangkatCommune,
    order.customerInfo.addressDetail,
  ].filter(Boolean);

  const fullAddress = addressParts.join(', ') || 'មិនមាន';
  const notesText = order.customerInfo.notes || 'មិនមាន';

  const itemsText = order.items
    .map((item, index) => {
      const name = item.product.nameKm || item.product.name;
      return `${index + 1}. ${name} (ចំនួន: ${item.quantity})`;
    })
    .join('\n');

  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });

  return `👤 ឈ្មោះ៖ ${order.customerInfo.fullName}
📞 លេខទូរស័ព្ទ៖ ${order.customerInfo.phone}

📍 ទីតាំង៖ ${fullAddress}

🛍️ ទំនិញដែលបានទិញ៖
${itemsText}

💵 សរុបទឹកប្រាក់៖ $${order.totalUsd.toFixed(2)} (៛${order.totalKhr.toLocaleString()})

📝 កំណត់សម្គាល់របស់អតិថិជន៖ ${notesText}

⏰ Upload Date / Time: ${nowStr}

💳 Payment Status: Pending Verification
📦 Order Preparation: Pending`;
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ]);
      return true;
    }
  } catch {
    // Clipboard copy ignore
  }
  return false;
}

export async function sendReceiptToTelegramBackend(
  order: Order,
  receiptDataUrl?: string | null,
  receiptFileName?: string | null
): Promise<{ success: boolean; message?: string; warning?: string }> {
  try {
    const uploadTime = new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });
    const response = await fetch('/api/send-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order,
        receiptDataUrl: receiptDataUrl || null,
        receiptFileName: receiptFileName || null,
        uploadTime,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send receipt to Telegram Bot');
    }
    return { success: true, message: data.message, warning: data.warning };
  } catch (err: any) {
    console.error('sendReceiptToTelegramBackend error:', err);
    return { success: false, message: err.message || 'Error connecting to server' };
  }
}

export async function openTelegramAdmin(order: Order, isPaid = true, receiptImageDataUrl?: string | null, receiptFileName?: string | null) {
  // First attempt to send directly via website backend Telegram Bot API
  const backendResult = await sendReceiptToTelegramBackend(order, receiptImageDataUrl, receiptFileName);
  
  if (backendResult.warning) {
    // Fallback to opening direct Telegram chat if secrets are not configured yet
    const hasReceipt = Boolean(receiptImageDataUrl);
    if (receiptImageDataUrl) {
      await copyImageToClipboard(receiptImageDataUrl);
    }
    const message = formatTelegramInvoice(order, isPaid, hasReceipt);
    const telegramUrl = `https://t.me/Lumimeiadmin?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  }

  return backendResult;
}
