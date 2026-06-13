/* ============================================================
   STORE PAYMENT CONFIG
   ============================================================ */

/* OPTION A — use your OWN working QR image (recommended, guaranteed to work).
   1. Save the exact QR you scanned from Google Pay / PhonePe / Paytm
      as an image into:  frontend/public/upi-qr.png
   2. Set UPI_QR_IMAGE below to "/upi-qr.png"
   The customer scans your real QR and types the amount shown ("Pay ₹X").
   This avoids the "payment cannot be done on this QR" error, which happens
   when UPI_ID is not a real, registered UPI handle. */
export const UPI_QR_IMAGE = ""   // e.g. "/upi-qr.png"

/* OPTION B — generate a QR from your UPI ID (also embeds the order amount).
   This ONLY works if UPI_ID is your REAL, registered VPA. To find it, open
   your UPI app → profile → "UPI IDs". A wrong id → "payment cannot be done". */
export const UPI_ID = "tanishjindal15@oksbi"
export const UPI_PAYEE_NAME = "Tanish Jindal"

// Online payment is available if either a QR image OR a valid UPI id is set
export const UPI_ENABLED =
  Boolean(UPI_QR_IMAGE) ||
  (Boolean(UPI_ID) && UPI_ID.includes("@") && UPI_ID !== "REPLACE_ME@upi")

/* Build the standard UPI deep-link that any UPI app can read from the QR.
   IMPORTANT: the VPA (pa) keeps its literal "@" — UPI apps reject a
   percent-encoded "%40", so we build the query manually and only encode
   the human-readable name. */
export const buildUpiLink = ({ amount }) => {
  const parts = [
    `pa=${UPI_ID}`,
    `pn=${encodeURIComponent(UPI_PAYEE_NAME)}`,
    `am=${Number(amount).toFixed(2)}`,
    `cu=INR`
  ]
  return `upi://pay?${parts.join("&")}`
}
