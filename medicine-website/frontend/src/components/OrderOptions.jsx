function OrderOptions() {

  // Single source of truth for the store's WhatsApp/call number
  const phoneNumber = "919837304482"          // used in wa.me links
  const phoneDisplay = "+91 98373 04482"       // shown to the user

  return (
    <div className="order-section">

      <h3 className="order-title">
        PLACE YOUR ORDER VIA WHATSAPP
      </h3>

      <div className="order-container">

        {/* Call / WhatsApp Order */}
        <a
          href={`https://wa.me/${phoneNumber}`}
          className="order-card"
          target="_blank"
          rel="noreferrer"
        >
          <div className="icon">📞</div>
          <p>
            Call <b>{phoneDisplay}</b> to place your order
          </p>
        </a>

        {/* Prescription Upload */}
        <a
          href={`https://wa.me/${phoneNumber}?text=Hello! I would like to place an order. Here is my prescription.`}
          className="order-card"
          target="_blank"
          rel="noreferrer"
        >
          <div className="icon">📄</div>
          <p>
            Upload your <b>prescription</b> on WhatsApp
          </p>
        </a>

      </div>

    </div>
  )
}

export default OrderOptions
