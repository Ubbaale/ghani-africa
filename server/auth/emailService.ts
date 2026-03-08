// SendGrid email service for authentication emails
// Uses Replit SendGrid connection integration

import sgMail from '@sendgrid/mail';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
    .replace(/&#10003;/gi, '✓')
    .replace(/&#\d+;/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let connectionSettings: any;

async function getCredentials() {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (apiKey && fromEmail && !fromEmail.startsWith('SG.')) {
    return { apiKey, email: fromEmail };
  }
  
  if (apiKey) {
    return { apiKey, email: 'info@africastradehub.com' };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('SendGrid credentials not found. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables.');
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

export function getEmailWrapper(baseUrl: string, content: string): string {
  const logoUrl = `${baseUrl}/images/ghani-africa-logo.png`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 24px 40px; text-align: center;">
              <img src="${logoUrl}" alt="Ghani Africa" width="60" height="60" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #c97f44; display: inline-block; vertical-align: middle;">
              <span style="display: inline-block; vertical-align: middle; margin-left: 12px; color: #ffffff; font-family: 'Georgia', serif; font-size: 22px; font-weight: bold; letter-spacing: 1px;">Ghani Africa</span>
            </td>
          </tr>
          <!-- Gold accent line -->
          <tr>
            <td style="background-color: #c97f44; height: 3px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8f5; border-top: 1px solid #e8e0d8; padding: 20px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 13px; color: #999;">
                African Digital Marketplace
              </p>
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 12px; color: #bbb;">
                Connecting businesses, traders, and consumers across Africa
              </p>
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #ccc;">
                &copy; ${new Date().getFullYear()} Ghani Africa. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  toEmail: string,
  firstName: string,
  verificationCode: string,
  baseUrl: string
): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  console.log(`SendGrid: Sending from "${fromEmail}" to "${toEmail}"`);

  const content = `
    <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a;">Welcome to Ghani Africa!</h1>
    <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${firstName || 'there'},</p>
    <p style="margin: 0 0 24px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Thank you for registering. Please use the verification code below to complete your registration:</p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="background-color: #faf8f5; border: 2px dashed #c97f44; padding: 20px 40px; border-radius: 8px; display: inline-block;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1a1a1a; font-family: 'Courier New', monospace;">${verificationCode}</span>
      </div>
    </div>
    <p style="text-align: center; font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 16px 0;">Enter this 6-digit code in the app to verify your email.</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #888; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #eee;">This code expires in <strong>15 minutes</strong>. If you did not create an account, please ignore this email.</p>
  `;

  const fullHtml = getEmailWrapper(baseUrl, content);
  await client.send({
    to: toEmail,
    from: { email: fromEmail, name: 'Ghani Africa' },
    replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
    subject: `${verificationCode} is your Ghani Africa verification code`,
    html: fullHtml,
    text: htmlToPlainText(fullHtml),
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'Ghani Africa',
    },
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  firstName: string,
  resetToken: string,
  baseUrl: string
): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  console.log(`SendGrid: Sending password reset from "${fromEmail}" to "${toEmail}"`);
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  const content = `
    <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a;">Password Reset Request</h1>
    <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${firstName || 'there'},</p>
    <p style="margin: 0 0 24px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetLink}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">Reset Password</a>
    </div>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 20px 0 8px 0;">Or copy and paste this link into your browser:</p>
    <p style="font-family: Arial, sans-serif; font-size: 13px; color: #888; word-break: break-all; background-color: #faf8f5; padding: 12px; border-radius: 4px; margin: 0 0 20px 0;">${resetLink}</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #888; margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #eee;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.</p>
  `;

  const fullHtml = getEmailWrapper(baseUrl, content);
  await client.send({
    to: toEmail,
    from: { email: fromEmail, name: 'Ghani Africa' },
    replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
    subject: 'Reset your password - Ghani Africa',
    html: fullHtml,
    text: htmlToPlainText(fullHtml),
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'Ghani Africa',
    },
  });
}

function getPromotionalEmailWrapper(baseUrl: string, content: string, unsubscribeUrl: string): string {
  const logoUrl = `${baseUrl}/images/ghani-africa-logo.png`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="650" cellpadding="0" cellspacing="0" style="max-width: 650px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 20px 30px; text-align: center;">
              <a href="${baseUrl}" style="text-decoration: none;">
                <img src="${logoUrl}" alt="Ghani Africa" width="50" height="50" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #c97f44; display: inline-block; vertical-align: middle;">
                <span style="display: inline-block; vertical-align: middle; margin-left: 10px; color: #ffffff; font-family: 'Georgia', serif; font-size: 20px; font-weight: bold; letter-spacing: 1px;">Ghani Africa</span>
              </a>
            </td>
          </tr>
          <!-- Navigation Menu -->
          <tr>
            <td style="background-color: #c97f44; padding: 10px 30px; text-align: center;">
              <a href="${baseUrl}/" style="color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; margin: 0 12px; display: inline-block;">Home</a>
              <a href="${baseUrl}/browse" style="color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; margin: 0 12px; display: inline-block;">Browse</a>
              <a href="${baseUrl}/categories" style="color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; margin: 0 12px; display: inline-block;">Categories</a>
              <a href="${baseUrl}/dashboard" style="color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; margin: 0 12px; display: inline-block;">My Account</a>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 28px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8f5; border-top: 1px solid #e8e0d8; padding: 20px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 13px; color: #999;">
                African Digital Marketplace
              </p>
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 12px; color: #bbb;">
                Connecting businesses, traders, and consumers across Africa
              </p>
              <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 11px; color: #ccc;">
                &copy; ${new Date().getFullYear()} Ghani Africa. All rights reserved.
              </p>
              <a href="${unsubscribeUrl}" style="font-family: Arial, sans-serif; font-size: 11px; color: #999; text-decoration: underline;">Unsubscribe from promotional emails</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildProductCard(product: any, baseUrl: string): string {
  const imageUrl = product.images?.[0] || `${baseUrl}/images/ghani-africa-logo.png`;
  const productUrl = `${baseUrl}/product/${product.id}`;
  const price = parseFloat(product.price || "0").toFixed(2);
  return `
    <td style="width: 50%; padding: 8px; vertical-align: top;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e0d8; border-radius: 6px; overflow: hidden;">
        <tr>
          <td style="padding: 0;">
            <a href="${productUrl}" style="text-decoration: none;">
              <img src="${imageUrl}" alt="${product.name}" width="280" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px;">
            <a href="${productUrl}" style="text-decoration: none; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; display: block; margin-bottom: 4px; line-height: 1.3;">${product.name}</a>
            <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 12px; color: #666; line-height: 1.4; overflow: hidden; max-height: 32px;">${(product.description || '').substring(0, 80)}${(product.description || '').length > 80 ? '...' : ''}</p>
            <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #c97f44;">$${price}</p>
            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #999;">${product.country || ''} ${product.city ? '- ' + product.city : ''}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 12px 12px 12px;">
            <a href="${productUrl}" style="display: block; text-align: center; background-color: #c97f44; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600;">View Product</a>
          </td>
        </tr>
      </table>
    </td>
  `;
}

function buildProductGrid(products: any[], baseUrl: string): string {
  if (products.length === 0) return '';
  let html = '';
  for (let i = 0; i < products.length; i += 2) {
    html += '<tr>';
    html += buildProductCard(products[i], baseUrl);
    if (i + 1 < products.length) {
      html += buildProductCard(products[i + 1], baseUrl);
    } else {
      html += '<td style="width: 50%; padding: 8px;">&nbsp;</td>';
    }
    html += '</tr>';
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${html}</table>`;
}

export async function sendPromotionalEmails(baseUrl: string, storageInstance: any): Promise<{ sent: number; skipped: number; failed: number }> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  
  const subscribedUsers = await storageInstance.getSubscribedUsers();
  const activeAds = await storageInstance.getActiveAdvertisements();
  
  const promotedProducts = activeAds.map((ad: any) => ad.product).filter(Boolean);
  
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const user of subscribedUsers) {
    try {
      let pref = await storageInstance.getEmailPreference(user.userId);
      if (!pref) {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        pref = await storageInstance.upsertEmailPreference({
          userId: user.userId,
          promoOptIn: true,
          unsubscribeToken: token,
        });
      }
      
      if (!pref?.promoOptIn) {
        skipped++;
        continue;
      }
      
      const topCategories = await storageInstance.getTopUserCategories(user.userId, 5);
      const topSearchTerms = await storageInstance.getTopUserSearchTerms(user.userId, 5);
      
      const categoryIds = topCategories.map((c: any) => c.categoryId);
      
      let suggestedProducts: any[] = [];
      if (categoryIds.length > 0 || topSearchTerms.length > 0) {
        const allProducts = await storageInstance.getProducts({ limit: 100 });
        suggestedProducts = allProducts.filter((p: any) => {
          if (promotedProducts.some((pp: any) => pp.id === p.id)) return false;
          if (categoryIds.includes(p.categoryId)) return true;
          if (topSearchTerms.some((term: string) => 
            p.name?.toLowerCase().includes(term.toLowerCase()) ||
            p.description?.toLowerCase().includes(term.toLowerCase())
          )) return true;
          return false;
        }).slice(0, 4);
      }
      
      if (promotedProducts.length === 0 && suggestedProducts.length === 0) {
        skipped++;
        continue;
      }
      
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${pref.unsubscribeToken}`;
      const firstName = user.firstName || 'there';
      
      let emailContent = `
        <h1 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 22px; color: #1a1a1a;">Curated picks for you</h1>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.5;">Hello ${firstName}, here are some products we think you'll love based on your interests.</p>
      `;
      
      if (promotedProducts.length > 0) {
        emailContent += `
          <h2 style="margin: 20px 0 12px 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #c97f44; padding-bottom: 6px;">Featured Products</h2>
          ${buildProductGrid(promotedProducts.slice(0, 6), baseUrl)}
        `;
      }
      
      if (suggestedProducts.length > 0) {
        emailContent += `
          <h2 style="margin: 24px 0 12px 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #c97f44; padding-bottom: 6px;">Recommended for You</h2>
          ${buildProductGrid(suggestedProducts, baseUrl)}
        `;
      }
      
      emailContent += `
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${baseUrl}/browse" style="background-color: #c97f44; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold;">Browse All Products</a>
        </div>
      `;
      
      const allProductIds = [
        ...promotedProducts.slice(0, 6).map((p: any) => p.id),
        ...suggestedProducts.map((p: any) => p.id)
      ];
      
      const promoHtml = getPromotionalEmailWrapper(baseUrl, emailContent, unsubscribeUrl);
      await client.send({
        to: user.email,
        from: { email: fromEmail, name: 'Ghani Africa' },
        replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
        subject: `${firstName}, check out these products on Ghani Africa`,
        html: promoHtml,
        text: htmlToPlainText(promoHtml),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Mailer': 'Ghani Africa',
        },
      });
      
      await storageInstance.logPromoEmail({
        userId: user.userId,
        subject: `${firstName}, check out these products on Ghani Africa`,
        productIds: allProductIds.join(','),
        status: 'sent',
      });
      
      await storageInstance.updateEmailPreference(user.userId, {
        lastPromoSentAt: new Date(),
      });
      
      sent++;
    } catch (error: any) {
      console.error(`Failed to send promo email to ${user.email}:`, error.message);
      failed++;
      try {
        await storageInstance.logPromoEmail({
          userId: user.userId,
          subject: 'Failed promotional email',
          productIds: null,
          status: 'failed',
        });
      } catch (e) {}
    }
  }
  
  return { sent, skipped, failed };
}

export async function sendBrowseReminderEmails(baseUrl: string, storageInstance: any): Promise<{ sent: number; skipped: number; failed: number }> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  
  const users = await storageInstance.getUsersWithRecentViews(48, 24);
  
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const user of users) {
    try {
      let pref = await storageInstance.getEmailPreference(user.userId);
      if (!pref) {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        pref = await storageInstance.upsertEmailPreference({
          userId: user.userId,
          promoOptIn: true,
          unsubscribeToken: token,
        });
      }
      
      if (!pref?.promoOptIn) {
        skipped++;
        continue;
      }
      
      const recentProducts = await storageInstance.getRecentlyViewedProducts(user.userId, 6);
      
      if (recentProducts.length === 0) {
        skipped++;
        continue;
      }
      
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${pref.unsubscribeToken}`;
      const firstName = user.firstName || 'there';
      
      let emailContent = `
        <h1 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 22px; color: #1a1a1a;">Still interested?</h1>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.5;">Hello ${firstName}, we noticed you were browsing some great products on Ghani Africa. Here are the items you recently viewed — they're still available!</p>
        
        <h2 style="margin: 20px 0 12px 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #c97f44; padding-bottom: 6px;">Your Recently Viewed Items</h2>
        ${buildProductGrid(recentProducts, baseUrl)}
        
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${baseUrl}/browse" style="background-color: #c97f44; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold;">Continue Shopping</a>
        </div>
        
        <p style="margin: 16px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #666; text-align: center; line-height: 1.5;">Don't miss out — popular items sell fast across Africa!</p>
      `;
      
      const productIds = recentProducts.map((p: any) => p.id);
      
      const browseHtml = getPromotionalEmailWrapper(baseUrl, emailContent, unsubscribeUrl);
      await client.send({
        to: user.email,
        from: { email: fromEmail, name: 'Ghani Africa' },
        replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
        subject: `${firstName}, your recently viewed items are still available`,
        html: browseHtml,
        text: htmlToPlainText(browseHtml),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Mailer': 'Ghani Africa',
        },
      });
      
      await storageInstance.logPromoEmail({
        userId: user.userId,
        subject: `${firstName}, your recently viewed items are still available!`,
        productIds: productIds.join(','),
        status: 'sent',
      });
      
      await storageInstance.updateEmailPreference(user.userId, {
        lastPromoSentAt: new Date(),
      });
      
      sent++;
    } catch (error: any) {
      console.error(`Failed to send browse reminder to ${user.email}:`, error.message);
      failed++;
    }
  }
  
  return { sent, skipped, failed };
}

export async function sendSubscriptionEventEmail(
  toEmail: string,
  sellerName: string,
  eventType: string,
  tierDisplayName: string,
  tierDetails?: {
    commissionRate: string;
    featuredSlots: string;
    hasVerifiedBadge: boolean;
    isHighlyRecommended: boolean;
  },
  baseUrl: string = 'http://localhost:5000'
): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();

  let subject = '';
  let content = '';

  const dashboardUrl = `${baseUrl}/dashboard/subscription`;

  switch (eventType) {
    case 'activated': {
      subject = `Your ${tierDisplayName} plan is now active - Ghani Africa`;
      const badges = [];
      if (tierDetails?.hasVerifiedBadge) badges.push('Verified Seller Badge');
      if (tierDetails?.isHighlyRecommended) badges.push('Highly Recommended Status');
      const badgeHtml = badges.length > 0
        ? `<div style="margin: 16px 0; padding: 16px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #166534;">Your New Badges:</p>
            ${badges.map(b => `<p style="margin: 2px 0; font-family: Arial, sans-serif; font-size: 14px; color: #166534;">&bull; ${b}</p>`).join('')}
           </div>`
        : '';

      content = `
        <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a;">Your Plan is Active!</h1>
        <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${sellerName},</p>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          Great news! Your <strong>${tierDisplayName}</strong> subscription is now active on Ghani Africa.
        </p>
        <div style="background-color: #faf8f5; border: 1px solid #e8e0d8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 16px; color: #1a1a1a;">Your Plan Benefits:</h3>
          <table style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <tr><td style="padding: 6px 0;">Commission Rate:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${tierDetails?.commissionRate || '5'}%</td></tr>
            <tr><td style="padding: 6px 0;">Featured Product Slots:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${tierDetails?.featuredSlots || '0'}</td></tr>
            <tr><td style="padding: 6px 0;">Products Allowed:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">Unlimited</td></tr>
          </table>
        </div>
        ${badgeHtml}
        <p style="margin: 16px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666; line-height: 1.6;">
          Your subscription will auto-renew. You can manage your billing anytime from your dashboard.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">View Your Subscription</a>
        </div>
      `;
      break;
    }

    case 'renewed': {
      subject = `Your ${tierDisplayName} plan has been renewed - Ghani Africa`;
      content = `
        <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a;">Subscription Renewed</h1>
        <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${sellerName},</p>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          Your <strong>${tierDisplayName}</strong> subscription has been successfully renewed. You'll continue to enjoy all your plan benefits without interruption.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">View Your Subscription</a>
        </div>
      `;
      break;
    }

    case 'cancelled': {
      subject = `Your subscription has been cancelled - Ghani Africa`;
      content = `
        <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a;">Subscription Cancelled</h1>
        <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${sellerName},</p>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          Your subscription has been cancelled. Your account has been moved to the <strong>Free</strong> plan with 8% commission rate.
        </p>
        <p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          You can still list products and sell on Ghani Africa. Upgrade anytime to enjoy lower commission rates and premium seller badges.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">Resubscribe</a>
        </div>
      `;
      break;
    }

    case 'payment_failed': {
      subject = `Payment failed for your ${tierDisplayName} plan - Ghani Africa`;
      content = `
        <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #c97f44;">Payment Issue</h1>
        <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${sellerName},</p>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          We were unable to process the payment for your <strong>${tierDisplayName}</strong> subscription. Please update your payment method to avoid losing your plan benefits.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #991b1b;">
            If payment is not resolved, your subscription will be downgraded to the Free plan and you'll lose access to premium badges and lower commission rates.
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">Update Payment Method</a>
        </div>
      `;
      break;
    }

    case 'expiring_soon': {
      subject = `Your ${tierDisplayName} plan expires soon - Ghani Africa`;
      content = `
        <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 24px; color: #c97f44;">Subscription Expiring Soon</h1>
        <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">Hello ${sellerName},</p>
        <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          Your <strong>${tierDisplayName}</strong> subscription is set to end soon. If you've cancelled, your benefits will expire at the end of the current period.
        </p>
        <p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">
          To keep your lower commission rates and premium seller badges, you can resubscribe from your dashboard.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">Manage Subscription</a>
        </div>
      `;
      break;
    }

    default:
      return;
  }

  const subHtml = getEmailWrapper(baseUrl, content);
  await client.send({
    to: toEmail,
    from: { email: fromEmail, name: 'Ghani Africa' },
    replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
    subject,
    html: subHtml,
    text: htmlToPlainText(subHtml),
    headers: {
      'X-Mailer': 'Ghani Africa',
    },
  });

  console.log(`Subscription email sent: ${eventType} to ${toEmail}`);
}

export async function sendManufacturerInviteEmail(
  toEmail: string,
  contactPerson: string | null,
  businessName: string | null,
  baseUrl: string
): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  const safeContact = contactPerson ? escapeHtml(contactPerson) : null;
  const safeBusiness = businessName ? escapeHtml(businessName) : null;
  const greeting = safeContact || (safeBusiness ? `Team ${safeBusiness}` : 'Hello');
  const signupUrl = `${baseUrl}`;
  const logoUrl = `${baseUrl}/images/ghani-africa-logo.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Hero Header with Large Logo -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 40px 40px 30px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" alt="Ghani Africa" width="90" height="90" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #c97f44; display: block; margin: 0 auto;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <h1 style="margin: 0; color: #ffffff; font-family: 'Georgia', serif; font-size: 28px; font-weight: bold; letter-spacing: 2px;">AFRICA'S TRADE HUB</h1>
                    <p style="margin: 6px 0 0 0; color: #c97f44; font-family: 'Georgia', serif; font-size: 14px; letter-spacing: 3px; text-transform: uppercase;">African Digital Marketplace</p>
                    <p style="margin: 6px 0 0 0; color: #888; font-size: 11px; letter-spacing: 1px;">Powered by Ghani Africa</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold Accent Bar -->
          <tr>
            <td style="background-color: #c97f44; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Personal Greeting -->
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.6;">Dear <strong>${greeting}</strong>,</p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.7;">
                We are writing to personally invite ${safeBusiness ? '<strong>' + safeBusiness + '</strong>' : 'your business'} to join <strong>Africa's Trade Hub</strong> &mdash; a platform built exclusively to empower African manufacturers, traders, and entrepreneurs to sell their products across the entire continent.
              </p>
            </td>
          </tr>

          <!-- Why This Matters Section -->
          <tr>
            <td style="padding: 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 10px; overflow: hidden;">
                <tr>
                  <td style="padding: 28px 30px;">
                    <h2 style="margin: 0 0 16px 0; color: #c97f44; font-family: 'Georgia', serif; font-size: 20px; text-align: center;">Why This Matters for Your Business</h2>
                    <p style="margin: 0 0 12px 0; color: #e0e0e0; font-size: 14px; line-height: 1.8;">
                      Africa's e-commerce market is projected to reach <strong style="color: #ffffff;">$75 billion by 2030</strong>. Yet most African manufacturers still struggle to reach buyers beyond their local markets. Africa's Trade Hub bridges that gap.
                    </p>
                    <p style="margin: 0; color: #e0e0e0; font-size: 14px; line-height: 1.8;">
                      By listing your products on our platform, you instantly gain access to buyers across <strong style="color: #ffffff;">54 African countries</strong> &mdash; all while we handle the complex logistics of cross-border trade, currency conversion, and secure payments.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Platform Statistics -->
          <tr>
            <td style="padding: 10px 40px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align: center; padding: 16px 8px;">
                    <div style="background-color: #faf8f5; border-radius: 10px; padding: 20px 10px; border: 1px solid #e8e0d8;">
                      <p style="margin: 0; font-size: 28px; font-weight: bold; color: #c97f44; font-family: 'Georgia', serif;">54</p>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">African Markets</p>
                    </div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 16px 8px;">
                    <div style="background-color: #faf8f5; border-radius: 10px; padding: 20px 10px; border: 1px solid #e8e0d8;">
                      <p style="margin: 0; font-size: 28px; font-weight: bold; color: #c97f44; font-family: 'Georgia', serif;">50+</p>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Currencies</p>
                    </div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 16px 8px;">
                    <div style="background-color: #faf8f5; border-radius: 10px; padding: 20px 10px; border: 1px solid #e8e0d8;">
                      <p style="margin: 0; font-size: 28px; font-weight: bold; color: #c97f44; font-family: 'Georgia', serif;">0%</p>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Setup Fee</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What You Get Section -->
          <tr>
            <td style="padding: 10px 40px;">
              <h2 style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 20px; color: #1a1a1a; text-align: center;">What You Get When You Join</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#127968;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Your Own Online Store &mdash; Free Forever</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">Get a professional storefront with unlimited product listings, your business branding, and a unique store link you can share anywhere.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#127757;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Reach Buyers in 54 African Countries</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">Your products become visible to millions of potential buyers across the continent. Our built-in cross-border trade system handles taxes, duties, and shipping estimates automatically.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#128274;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Secure Escrow Payments</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">Every transaction is protected with our escrow system. Buyer payments are held securely until delivery is confirmed &mdash; protecting both you and your customers.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#128176;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Automatic Multi-Currency Pricing</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">List your prices once &mdash; buyers see them converted to their local currency automatically. We support 50+ African currencies including Naira, Cedi, Shilling, Rand, CFA Franc, and more.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#128666;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Built-in Logistics & Pickup Points</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">Integrated shipping with express delivery options and 25+ pickup points across major cities including Nairobi, Lagos, Accra, Kampala, Johannesburg, and more.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 18px; background-color: #faf8f5; border-left: 4px solid #c97f44; border-radius: 0 8px 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="vertical-align: top; padding-right: 12px; font-size: 22px;">&#128200;</td>
                      <td>
                        <strong style="color: #1a1a1a; font-size: 15px;">Business Growth Tools</strong>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.5;">Receive product quotation requests from serious buyers, get verified seller badges to build trust, and access advertising tools to boost your visibility.</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c97f44; border-radius: 8px; text-align: center;">
                    <a href="${signupUrl}" style="color: #ffffff; padding: 18px 50px; text-decoration: none; display: inline-block; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; letter-spacing: 1px;">Join Africa's Trade Hub &mdash; It's Free</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 40px 30px 40px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #999;">No credit card required. Start selling in under 5 minutes.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #f0ebe4; margin: 0;">
            </td>
          </tr>

          <!-- How to Enroll Guide -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 6px 0; font-family: 'Georgia', serif; font-size: 20px; color: #1a1a1a; text-align: center;">How to Get Started</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #888; text-align: center;">Follow these simple steps to set up your store</p>

              <!-- Step 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #c97f44, #e0a060); border-radius: 50%; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 18px;">1</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">Create Your Account</strong>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.6;">Visit <a href="${signupUrl}" style="color: #c97f44; text-decoration: underline;">Africastradehub.com</a> and click <strong>"Sign Up"</strong>. Enter your email address and create a password. Verify your email with the code we send you.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #c97f44, #e0a060); border-radius: 50%; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 18px;">2</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">Set Up Your Business Profile</strong>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.6;">Go to <strong>"My Store"</strong> in your dashboard. Add your business name, description, country, and logo. Choose your industry category so buyers can find you easily.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #c97f44, #e0a060); border-radius: 50%; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 18px;">3</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">Add Your Products</strong>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.6;">Click <strong>"Add Product"</strong> and upload photos of your products. Set your price (in USD &mdash; we convert it to local currencies automatically), add a description, and set your minimum order quantity.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 4 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #c97f44, #e0a060); border-radius: 50%; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 18px;">4</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">Start Receiving Orders</strong>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; line-height: 1.6;">That's it! Your products are now visible to buyers across Africa. You'll receive notifications when orders come in or when buyers request quotations. Payments are processed securely through our escrow system.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Second CTA -->
          <tr>
            <td style="padding: 10px 40px 30px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1a1a; border-radius: 8px; border: 2px solid #c97f44; text-align: center;">
                    <a href="${signupUrl}" style="color: #c97f44; padding: 16px 44px; text-decoration: none; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">Create Your Free Store Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Questions / Support -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; border-radius: 8px; border: 1px solid #e8e0d8;">
                <tr>
                  <td style="padding: 20px 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #1a1a1a; font-weight: bold;">Have Questions?</p>
                    <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                      Simply reply to this email and our team will be happy to help you get started. We can even walk you through the setup process personally.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 28px 40px; text-align: center;">
              <img src="${logoUrl}" alt="Ghani Africa" width="40" height="40" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #c97f44; display: inline-block; margin-bottom: 10px;">
              <p style="margin: 0 0 6px 0; font-size: 14px; color: #c97f44; font-family: 'Georgia', serif; font-weight: bold; letter-spacing: 1px;">AFRICA'S TRADE HUB</p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">African Digital Marketplace</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #777;">Powered by Ghani Africa</p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #888;">Connecting businesses, traders, and consumers across Africa</p>
              <p style="margin: 0; font-size: 11px; color: #666;">&copy; ${new Date().getFullYear()} Africa's Trade Hub. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await client.send({
    to: toEmail,
    from: { email: fromEmail, name: 'Ghani Africa' },
    replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
    subject: `${safeBusiness ? safeBusiness + ', join' : 'Join'} Africa's Trade Hub - sell to buyers across Africa`,
    html,
    text: htmlToPlainText(html),
    headers: {
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Ghani Africa',
    },
  });
  console.log(`Manufacturer invite email sent to ${toEmail}`);
}

export async function sendManufacturerFollowUpEmail(
  toEmail: string,
  contactPerson: string | null,
  businessName: string | null,
  followUpNumber: number,
  baseUrl: string
): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();
  const safeContact = contactPerson ? escapeHtml(contactPerson) : null;
  const safeBusiness = businessName ? escapeHtml(businessName) : null;
  const greeting = safeContact || (safeBusiness ? `Team ${safeBusiness}` : 'Hello');
  const signupUrl = `${baseUrl}`;
  const logoUrl = `${baseUrl}/images/ghani-africa-logo.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="Ghani Africa" width="70" height="70" style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid #c97f44; display: block; margin: 0 auto 12px auto;">
              <h1 style="margin: 0; color: #ffffff; font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; letter-spacing: 2px;">AFRICA'S TRADE HUB</h1>
              <p style="margin: 4px 0 0 0; color: #c97f44; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">African Digital Marketplace</p>
              <p style="margin: 4px 0 0 0; color: #888; font-size: 10px; letter-spacing: 1px;">Powered by Ghani Africa</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #c97f44; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.6;">Dear <strong>${greeting}</strong>,</p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.7;">
                We recently reached out about joining <strong>Africa's Trade Hub</strong> and we wanted to follow up because we genuinely believe ${safeBusiness ? '<strong>' + safeBusiness + '</strong>' : 'your business'} would thrive on our platform.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.7;">
                Every day, buyers from across Africa are searching for quality products. Don't miss the opportunity to put your business in front of them.
              </p>

              <!-- Quick Reminder Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; border-radius: 10px; border: 1px solid #e8e0d8; margin: 20px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 14px 0; font-size: 16px; color: #1a1a1a; font-weight: bold;">Quick reminder of what's waiting for you:</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #555; line-height: 1.6;">&#10003;&nbsp;&nbsp;Free store setup &mdash; no fees, no catches</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #555; line-height: 1.6;">&#10003;&nbsp;&nbsp;Buyers from 54 African countries actively browsing</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #555; line-height: 1.6;">&#10003;&nbsp;&nbsp;Secure escrow payment protection</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #555; line-height: 1.6;">&#10003;&nbsp;&nbsp;Automatic pricing in 50+ African currencies</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #555; line-height: 1.6;">&#10003;&nbsp;&nbsp;Takes less than 5 minutes to get started</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px auto 20px auto;" align="center">
                <tr>
                  <td style="background-color: #c97f44; border-radius: 8px; text-align: center;">
                    <a href="${signupUrl}" style="color: #ffffff; padding: 18px 50px; text-decoration: none; display: inline-block; font-family: Arial, sans-serif; font-size: 17px; font-weight: bold; letter-spacing: 0.5px;">Start Selling on Africa's Trade Hub</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #999; text-align: center;">No credit card required. Set up your store in minutes.</p>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                If you'd like help getting set up, simply reply to this email and we'll guide you through the process personally.
              </p>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #bbb; padding-top: 16px; border-top: 1px solid #eee;">
                If you're not interested, no worries &mdash; we won't send further reminders. Reply "unsubscribe" to opt out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #c97f44; font-family: 'Georgia', serif; font-weight: bold; letter-spacing: 1px;">AFRICA'S TRADE HUB</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #777;">Powered by Ghani Africa</p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #888;">Connecting businesses, traders, and consumers across Africa</p>
              <p style="margin: 0; font-size: 11px; color: #666;">&copy; ${new Date().getFullYear()} Africa's Trade Hub. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await client.send({
    to: toEmail,
    from: { email: fromEmail, name: 'Ghani Africa' },
    replyTo: { email: fromEmail, name: 'Ghani Africa Support' },
    subject: `${safeBusiness ? safeBusiness + ', your' : 'Your'} free store on Africa's Trade Hub is ready`,
    html,
    text: htmlToPlainText(html),
    headers: {
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Mailer': 'Ghani Africa',
    },
  });
  console.log(`Manufacturer follow-up #${followUpNumber} email sent to ${toEmail}`);
}
