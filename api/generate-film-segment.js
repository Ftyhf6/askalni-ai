export const runtime = "nodejs24.x";

// Free-only safeguard: this endpoint intentionally does not call paid video APIs.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  return res.status(410).json({
    error: "تم إيقاف مسار Runway المدفوع. التصنيع الكامل المجاني متعدد المشاهد لم يكتمل بعد؛ استخدم تجربة المشهد المجاني عبر Wan 2.2.",
    code: "PAID_VIDEO_DISABLED"
  });
}
