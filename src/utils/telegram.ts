import { Order } from '../types';

export function formatTelegramInvoice(order: Order, _isPaid = true, hasReceipt = false): string {
  const addressParts = [
    order.customerInfo.cityProvince,
    order.customerInfo.districtSangkat,
    order.customerInfo.addressDetail,
  ].filter(Boolean);

  const fullAddress = addressParts.join(', ') || 'មិនមាន';
  const notesText = order.customerInfo.notes ? `\n📝 ចំណាំ: ${order.customerInfo.notes}` : '';

  const itemsText = order.items
    .map((item, index) => {
      const name = item.product.nameKm || item.product.name;
      return `${index + 1}. ${name} (ចំនួន: ${item.quantity})`;
    })
    .join('\n');

  const receiptText = hasReceipt
    ? '\n📸 វិក័យបត្ររូបភាព: បាន Upload និងចម្លងរូបភាពរួចរាល់ (សូមចុច Paste/បិទភ្ជាប់ រូបភាពផ្ញើចូល Chat)'
    : '';

  return `👤 ឈ្មោះ: ${order.customerInfo.fullName}
📍 ទីតាំង: ${fullAddress}${notesText}
📞 លេខទូរស័ព្ទ: ${order.customerInfo.phone}

🛍️ ទំនិញដែលមានទិញ:
${itemsText}

💵 សរុបទឹកប្រាក់: $${order.totalUsd.toFixed(2)} (៛${order.totalKhr.toLocaleString()})${receiptText}`;
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
  } catch (err) {
    console.error('Could not copy image to clipboard', err);
  }
  return false;
}

export async function openTelegramAdmin(order: Order, isPaid = true, receiptImageDataUrl?: string | null) {
  const hasReceipt = Boolean(receiptImageDataUrl);
  if (receiptImageDataUrl) {
    await copyImageToClipboard(receiptImageDataUrl);
  }
  const message = formatTelegramInvoice(order, isPaid, hasReceipt);
  const telegramUrl = `https://t.me/Lumimeiadmin?text=${encodeURIComponent(message)}`;
  window.open(telegramUrl, '_blank');
}
