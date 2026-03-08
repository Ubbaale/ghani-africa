import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&copy;/gi, '©')
    .replace(/&#\d+;/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    const htmlContent = options.html || options.text || '';
    
    await client.send({
      to: options.to,
      from: { email: fromEmail, name: 'Ghani Africa' },
      replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
      subject: options.subject,
      text: options.text || htmlToPlainText(htmlContent),
      html: htmlContent,
      headers: {
        'X-Mailer': 'Ghani Africa',
      },
    });
    
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

function getAppUrl(): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const deploymentId = process.env.REPLIT_DEPLOYMENT;
  if (devDomain) return `https://${devDomain}`;
  if (deploymentId) return `https://${process.env.REPL_SLUG || 'ghani-africa'}.replit.app`;
  return 'https://ghani-africa.replit.app';
}

export function emailHeader(): string {
  const logoUrl = `${getAppUrl()}/images/ghani-africa-logo.png`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4a2810 0%, #6b3a1f 100%); padding: 20px; text-align: center;">
        <img src="${logoUrl}" alt="Ghani Africa" style="height: 50px; width: 50px; display: inline-block; vertical-align: middle;" />
        <span style="color: #f5a623; font-size: 22px; font-weight: bold; vertical-align: middle; margin-left: 10px;">Ghani Africa Marketplace</span>
      </div>
      <div style="padding: 24px;">
  `;
}

export function emailFooter(): string {
  const appUrl = getAppUrl();
  return `
      </div>
      <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
          <a href="${appUrl}" style="color: #4a2810; font-weight: 600; text-decoration: none;">Ghani Africa</a> - African Digital Marketplace
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          Powered by PAIDM | Connecting Africa's trade ecosystem
        </p>
      </div>
    </div>
  `;
}

export async function sendOrderConfirmation(to: string, orderId: number, totalAmount: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Order Confirmation #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Order Confirmed!</h1>
        <p>Thank you for your order on Ghani Africa.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> #${orderId}</p>
          <p><strong>Total Amount:</strong> $${totalAmount}</p>
        </div>
        <p>We'll notify you when your order ships.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendShippingNotification(to: string, orderId: number, trackingNumber: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Your Order #${orderId} Has Shipped - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Your Order Has Shipped!</h1>
        <p>Great news! Your order from Ghani Africa is on its way.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> #${orderId}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        </div>
        <p>Track your shipment in your dashboard.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Welcome to Ghani Africa!`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Welcome to Ghani Africa!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Africa's premier digital marketplace. You now have access to:</p>
        <ul>
          <li>Products from 54 African countries</li>
          <li>Secure escrow payments</li>
          <li>Direct messaging with sellers</li>
          <li>Trade assurance protection</li>
        </ul>
        <p>Start exploring today!</p>
      ${emailFooter()}
    `,
  });
}

export async function sendPasswordReset(to: string, resetToken: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Password Reset Request - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Password Reset</h1>
        <p>You requested to reset your password for Ghani Africa.</p>
        <p>Your reset code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${resetToken}</span>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendStaleShipmentReminder(to: string, orderId: number, trackingNumber: string, hoursSinceUpdate: number): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Action Required: Update Shipment #${trackingNumber} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #f59e0b;">⚠️ Shipment Update Required</h1>
        <p>Your shipment for <strong>Order #${orderId}</strong> has not been updated in <strong>${Math.round(hoursSinceUpdate)} hours</strong>.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Last Update:</strong> ${Math.round(hoursSinceUpdate)} hours ago</p>
        </div>
        <p>Please log in and update the shipment status to:</p>
        <ul>
          <li>Maintain buyer trust</li>
          <li>Avoid automatic dispute resolution</li>
          <li>Ensure timely escrow release</li>
        </ul>
        <p style="color: #dc2626; font-weight: bold;">Shipments without updates for 5 days will trigger an automatic dispute.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendBuyerStaleAlert(to: string, orderId: number, trackingNumber: string, hoursSinceUpdate: number): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Shipping Update Alert: Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #3b82f6;">Shipping Update Alert</h1>
        <p>We noticed that the shipment for your <strong>Order #${orderId}</strong> hasn't been updated recently.</p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Last Update:</strong> ${Math.round(hoursSinceUpdate)} hours ago</p>
        </div>
        <p><strong>Your payment is protected.</strong> Your funds are held in escrow and will not be released until you confirm delivery.</p>
        <p>We have notified the seller to provide an update. If the situation doesn't improve, you can open a dispute through your order page.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendAutoDisputeNotification(to: string, orderId: number, role: 'buyer' | 'seller'): Promise<boolean> {
  const isBuyer = role === 'buyer';
  return sendEmail({
    to,
    subject: `Automatic Dispute Opened: Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #dc2626;">Dispute Opened Automatically</h1>
        <p>An automatic dispute has been opened for <strong>Order #${orderId}</strong> due to lack of shipping updates.</p>
        ${isBuyer ? `
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Your payment remains protected</strong> in escrow.</p>
            <p>Our team will review this case and ensure a fair resolution.</p>
          </div>
        ` : `
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p>The shipment for this order was not updated for 5+ days.</p>
            <p>Please respond to the dispute with evidence of shipping progress to resolve this matter.</p>
          </div>
        `}
        <p>Log in to your account to view and respond to this dispute.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendShipperAssignmentNotification(to: string, orderId: number, courierName: string, trackingNumber: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Courier Assigned to Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Courier Assigned to Your Order</h1>
        <p>Great news! A courier has been assigned to handle the delivery of your order.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Courier:</strong> ${courierName}</p>
          ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
        </div>
        <p>You can track your shipment's progress in your account dashboard.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendNewShipmentNotification(to: string, shipmentId: number, pickupCity: string, deliveryCity: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New Shipment Assignment - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">New Shipment Assigned to You</h1>
        <p>You have been assigned a new shipment that needs pickup and delivery.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Shipment ID:</strong> SHIP${shipmentId}</p>
          <p><strong>Pickup:</strong> ${pickupCity}</p>
          <p><strong>Delivery:</strong> ${deliveryCity}</p>
        </div>
        <p>Please log in to your shipper dashboard to accept or review this assignment.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendShipmentBroadcastNotification(to: string, shipmentId: number, pickupCity: string, deliveryCity: string, packageType?: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New Delivery Job Available - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #f59e0b;">New Delivery Job Available!</h1>
        <p>A new shipment is available and waiting for a courier. Be the first to accept it!</p>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Shipment ID:</strong> SHIP${shipmentId}</p>
          <p><strong>Pickup:</strong> ${pickupCity}</p>
          <p><strong>Delivery:</strong> ${deliveryCity}</p>
          ${packageType ? `<p><strong>Package Type:</strong> ${packageType}</p>` : ''}
        </div>
        <p><strong>First come, first served!</strong> Log in to your shipper dashboard to accept this job before another courier does.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendEscrowPaymentEmail(to: string, orderId: number, amount: string, currency: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Payment Secured in Escrow - Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Payment Secured in Escrow</h1>
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Amount:</strong> ${currency} ${amount}</p>
          <p><strong>Status:</strong> Funds held safely until delivery is confirmed</p>
        </div>
        <p>Your payment is protected by our escrow system. The seller will only receive the funds once you confirm delivery.</p>
        <p style="font-size: 13px; color: #6b7280;">If there's a dispute and it's not resolved within 7 days, you'll be automatically refunded.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendEscrowShippedEmail(to: string, orderId: number, isBuyer: boolean): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Order #${orderId} Has Been Shipped - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #3b82f6;">Order Shipped!</h1>
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Escrow Status:</strong> Funds still held securely</p>
        </div>
        ${isBuyer
          ? '<p>Your order is on its way! Track it from your orders page. Once delivered, please confirm receipt to release payment to the seller.</p>'
          : '<p>Your shipment is confirmed. The buyer will be notified. Funds will be released once the buyer confirms delivery.</p>'
        }
      ${emailFooter()}
    `,
  });
}

export async function sendEscrowDeliveredEmail(to: string, orderId: number): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Delivery Confirmed - Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Delivery Confirmed!</h1>
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Status:</strong> Delivery verified</p>
        </div>
        <p>The delivery has been confirmed with proof of delivery. Please review the order from your orders page.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendEscrowReleasedEmail(to: string, orderId: number, amount: string, currency: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Payment Released - Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">Payment Released to Your Wallet!</h1>
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Amount Released:</strong> ${currency} ${amount}</p>
          <p><strong>Destination:</strong> Your Ghani Africa Wallet</p>
        </div>
        <p>The buyer confirmed receipt and your payment has been released. You can withdraw the funds from your wallet.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendDisputeAutoRefundEmail(to: string, orderId: number, disputeId: number, amount: string, currency: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Automatic Refund Processed - Dispute #${disputeId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #f59e0b;">Automatic Refund Processed</h1>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Dispute:</strong> #${disputeId}</p>
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Refund Amount:</strong> ${currency} ${amount}</p>
        </div>
        <p>Your dispute was not resolved within 7 days, so the funds have been automatically refunded to your wallet as part of our Buyer Protection guarantee.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendSellerNewOrderNotification(
  to: string,
  orderId: number,
  totalAmount: string,
  buyerName: string,
  items: { name: string; quantity: number; unitPrice: string }[],
  commissionRate: string,
  shippingAddress?: any
): Promise<boolean> {
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.unitPrice}</td></tr>`
  ).join('');

  const addressBlock = shippingAddress ? `
    <div style="background:#f9fafb;padding:12px;border-radius:6px;margin-top:10px;">
      <p style="margin:0 0 4px;font-weight:600;font-size:13px;">Ship To:</p>
      <p style="margin:0;font-size:13px;color:#374151;">${shippingAddress.fullName || ''}<br/>
      ${shippingAddress.street || ''}<br/>
      ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}<br/>
      ${shippingAddress.country || ''}</p>
    </div>
  ` : '';

  return sendEmail({
    to,
    subject: `New Order Received #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">New Order Received!</h1>
        <p>You have a new order from <strong>${buyerName}</strong>.</p>
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p><strong>Order:</strong> #${orderId}</p>
          <p><strong>Total Amount:</strong> $${totalAmount}</p>
          <p><strong>Platform Commission:</strong> ${commissionRate}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:15px 0;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${addressBlock}
        <div style="background:#fffbeb;padding:12px;border-radius:6px;margin:15px 0;border-left:4px solid #f59e0b;">
          <p style="margin:0;font-size:13px;"><strong>Important Terms:</strong></p>
          <ul style="margin:8px 0 0;padding-left:20px;font-size:12px;color:#92400e;">
            <li>Payment is held in escrow until buyer confirms delivery.</li>
            <li>You must ship within 3 business days of the order.</li>
            <li>Upload proof of shipment with tracking number.</li>
            <li>Funds are released after buyer confirms receipt or after 14 days with delivery proof.</li>
            <li>Disputes must be responded to within 48 hours.</li>
          </ul>
        </div>
        <p>Please log in to your seller dashboard to process this order.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendBuyerTransactionReceipt(
  to: string,
  orderId: number,
  items: { name: string; quantity: number; unitPrice: string; totalPrice: string }[],
  subtotal: string,
  platformFee: string,
  total: string,
  paymentMethod: string,
  shippingAddress?: any
): Promise<boolean> {
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.unitPrice}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.totalPrice}</td></tr>`
  ).join('');

  const addressBlock = shippingAddress ? `
    <div style="background:#f9fafb;padding:12px;border-radius:6px;margin-top:15px;">
      <p style="margin:0 0 4px;font-weight:600;font-size:13px;">Shipping To:</p>
      <p style="margin:0;font-size:13px;color:#374151;">${shippingAddress.fullName || ''}<br/>
      ${shippingAddress.street || ''}<br/>
      ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}<br/>
      ${shippingAddress.country || ''}</p>
    </div>
  ` : '';

  return sendEmail({
    to,
    subject: `Transaction Receipt - Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <div style="background:#10b981;color:white;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
          <h1 style="margin:0;">Transaction Receipt</h1>
          <p style="margin:5px 0 0;opacity:0.9;">Order #${orderId}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Unit</th><th style="padding:8px;text-align:right;">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="border-top:2px solid #e5e7eb;padding-top:10px;margin-top:10px;">
          <table style="width:100%;font-size:14px;">
            <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;padding:4px 0;">$${subtotal}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Platform Fee (5%)</td><td style="text-align:right;padding:4px 0;color:#6b7280;">$${platformFee}</td></tr>
            <tr style="font-weight:bold;font-size:16px;"><td style="padding:8px 0;border-top:2px solid #10b981;">Total Paid</td><td style="text-align:right;padding:8px 0;border-top:2px solid #10b981;">$${total}</td></tr>
          </table>
        </div>
        <div style="margin-top:10px;font-size:13px;color:#6b7280;">
          <p><strong>Payment Method:</strong> ${paymentMethod === 'stripe' ? 'Credit/Debit Card (Stripe)' : paymentMethod}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${addressBlock}
        <div style="background:#ecfdf5;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
          <p style="margin:0 0 8px;font-weight:600;color:#065f46;">Buyer Protection & Terms</p>
          <ul style="margin:0;padding-left:20px;font-size:12px;color:#047857;">
            <li>Your payment is held securely in escrow until you confirm delivery.</li>
            <li>You have 30 days from purchase to file a dispute if there's an issue.</li>
            <li>If a dispute is not resolved within 7 days, you receive an automatic refund.</li>
            <li>Seller must ship within 3 business days.</li>
            <li>You must confirm receipt within 14 days of delivery, or funds auto-release.</li>
            <li>Platform fee (5%) is non-refundable and covers escrow & dispute services.</li>
          </ul>
        </div>
      ${emailFooter()}
    `,
  });
}

export async function sendSellerTransactionReceipt(
  to: string,
  orderId: number,
  items: { name: string; quantity: number; unitPrice: string; totalPrice: string }[],
  subtotal: string,
  commissionAmount: string,
  commissionRate: string,
  netPayout: string
): Promise<boolean> {
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.unitPrice}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${i.totalPrice}</td></tr>`
  ).join('');

  return sendEmail({
    to,
    subject: `Seller Receipt - Order #${orderId} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <div style="background:#3b82f6;color:white;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
          <h1 style="margin:0;">Seller Transaction Receipt</h1>
          <p style="margin:5px 0 0;opacity:0.9;">Order #${orderId}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Unit</th><th style="padding:8px;text-align:right;">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="border-top:2px solid #e5e7eb;padding-top:10px;margin-top:10px;">
          <table style="width:100%;font-size:14px;">
            <tr><td style="padding:4px 0;">Order Subtotal</td><td style="text-align:right;padding:4px 0;">$${subtotal}</td></tr>
            <tr><td style="padding:4px 0;color:#dc2626;">Commission (${commissionRate})</td><td style="text-align:right;padding:4px 0;color:#dc2626;">-$${commissionAmount}</td></tr>
            <tr style="font-weight:bold;font-size:16px;"><td style="padding:8px 0;border-top:2px solid #3b82f6;">Your Net Payout</td><td style="text-align:right;padding:8px 0;border-top:2px solid #3b82f6;">$${netPayout}</td></tr>
          </table>
        </div>
        <div style="margin-top:10px;font-size:13px;color:#6b7280;">
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Payout Status:</strong> Held in Escrow</p>
        </div>
        <div style="background:#eff6ff;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #3b82f6;">
          <p style="margin:0 0 8px;font-weight:600;color:#1e40af;">Seller Terms & Conditions</p>
          <ul style="margin:0;padding-left:20px;font-size:12px;color:#1e3a8a;">
            <li>Funds are held in escrow until buyer confirms delivery.</li>
            <li>You must ship within 3 business days and provide a tracking number.</li>
            <li>Upload proof of delivery when the item is delivered.</li>
            <li>Funds auto-release 14 days after confirmed delivery if no dispute is filed.</li>
            <li>Respond to disputes within 48 hours to avoid automatic resolution in buyer's favor.</li>
            <li>Commission rate (${commissionRate}) is deducted from the order total.</li>
            <li>Net payout is credited to your Ghani Africa Wallet upon escrow release.</li>
          </ul>
        </div>
      ${emailFooter()}
    `,
  });
}

export async function sendMessageNotification(to: string, senderName: string, productName?: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New Message from ${senderName} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <h1 style="color: #10b981;">You Have a New Message</h1>
        <p>${senderName} sent you a message${productName ? ` about "${productName}"` : ''}.</p>
        <p>Log in to your Ghani Africa account to view and respond.</p>
      ${emailFooter()}
    `,
  });
}

export async function sendAdminTransactionAlert(
  adminEmail: string,
  alertType: string,
  title: string,
  details: { orderId?: number; amount?: string; userId?: string; description?: string }
): Promise<boolean> {
  const severityColors: Record<string, string> = {
    'new_order': '#10b981',
    'payment_received': '#3b82f6',
    'dispute_opened': '#f59e0b',
    'dispute_resolved': '#10b981',
    'refund_issued': '#ef4444',
    'escrow_released': '#8b5cf6',
    'shipment_stale': '#f59e0b',
  };
  const color = severityColors[alertType] || '#6b7280';

  return sendEmail({
    to: adminEmail,
    subject: `[Admin Alert] ${title} - Ghani Africa`,
    html: `
      ${emailHeader()}
        <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 20px;">Admin Transaction Alert</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">${title}</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          ${details.orderId ? `<p><strong>Order:</strong> #${details.orderId}</p>` : ''}
          ${details.amount ? `<p><strong>Amount:</strong> $${details.amount}</p>` : ''}
          ${details.userId ? `<p><strong>User ID:</strong> ${details.userId}</p>` : ''}
          ${details.description ? `<p><strong>Details:</strong> ${details.description}</p>` : ''}
          <p style="margin-top: 15px;">Log in to the <strong>Admin Dashboard</strong> to review this transaction.</p>
        </div>
      ${emailFooter()}
    `,
  });
}
