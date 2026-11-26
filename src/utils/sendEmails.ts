import nodemailer from "nodemailer";

// Transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"WegoStores" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: `<div style="font-family: Arial; direction: rtl; padding: 20px;">
        <h2>كود التحقق</h2>
        <p style="font-size: 24px; font-weight: bold;">${escapeHtml(text)}</p>
      </div>`,
    });
    return info;
  } catch (err: any) {
    console.error("Error:", err.message);
    throw err;
  }
};

export interface PackageUpgradeEmailParams {
  to: string;
  userName: string;
  subdomain: string;
  orders: number;
  ordersTo: number;
}

export const sendPackageUpgradeEmail = async ({
  to,
  userName,
  subdomain,
  orders,
  ordersTo,
}: PackageUpgradeEmailParams) => {
  const safeName = escapeHtml(userName);
  const safeSubdomain = escapeHtml(subdomain);
  const subject = "تنبيه هام: وصلت إلى الحد الأقصى للطلبات — يرجى ترقية باقتك";
  const text = [
    `مرحباً ${userName}،`,
    `نود إعلامك بأن متجرك (${subdomain}) قد وصل إلى الحد الأقصى المسموح به للطلبات في باقتك الحالية (${orders} من ${ordersTo} طلب).`,
    "لضمان استمرار استقبال طلبات عملائك دون أي انقطاع، يرجى ترقية باقتك الحالية إلى باقة أعلى.",
    "مع تحيات فريق WegoStores",
  ].join("\n");

  const html = `
  <div style="margin:0;padding:24px;background-color:#f4f6f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#1f2937;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:24px 28px;color:#ffffff;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">تنبيه استهلاك الباقة — WegoStores</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">إشعار مهم بخصوص حد الطلبات في متجرك</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 14px;font-size:16px;font-weight:600;">مرحباً ${safeName}،</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">
          نود إعلامك بأن متجرك قد وصل إلى <strong>الحد الأقصى للطلبات</strong> المتاح ضمن باقتك الحالية.
          لضمان استمرار عمل متجرك واستقبال طلبات عملائك بسلاسة دون انقطاع، نرجو منك <strong>ترقية الباقة (Upgrade Package)</strong> إلى باقة أكبر.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;margin:18px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;">النطاق الفرعي (Subdomain):</td>
              <td style="padding:6px 0;font-weight:600;text-align:left;direction:ltr;">${safeSubdomain}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">عدد الطلبات المنفذة:</td>
              <td style="padding:6px 0;font-weight:700;color:#dc2626;text-align:left;">${orders}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">الحد الأقصى للباقة الحالية:</td>
              <td style="padding:6px 0;font-weight:700;color:#111827;text-align:left;">${ordersTo}</td>
            </tr>
          </table>
        </div>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#4b5563;">
          يمكنك طلب ترقية الباقة الآن من خلال لوحة التحكم أو بالتواصل مع فريق الدعم الفني لمساعدتك فوراً.
        </p>
      </div>
      <div style="background:#f9fafb;padding:14px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
        مع أطيب التحيات، فريق WegoStores
      </div>
    </div>
  </div>`;

  const info = await transporter.sendMail({
    from: `"WegoStores" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
};
