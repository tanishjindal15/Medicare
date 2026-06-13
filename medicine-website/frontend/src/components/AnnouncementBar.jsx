function AnnouncementBar(){

  return(

    <div style={{
      width:"100%",
      overflow:"hidden",
      background:"linear-gradient(90deg,#11998e,#38ef7d)",
      color:"white",
      padding:"12px 0",
      fontWeight:"600",
      position:"relative"
    }}>

      <div className="scroll-container">

        <div className="scroll-content">
          <span>💊 Upto 51% OFF on Medicines</span>
          <span>🧾 Upload Prescription via WhatsApp</span>
          <span>💉 100% Trusted Medical Store</span>
          <span>🎯 Best Prices Guaranteed</span>

          {/* 🔥 duplicate for seamless loop */}
          <span>💊 Upto 51% OFF on Medicines</span>
          <span>🧾 Upload Prescription via WhatsApp</span>
          <span>💉 100% Trusted Medical Store</span>
          <span>🎯 Best Prices Guaranteed</span>
        </div>

      </div>

      <style>{`

        .scroll-container {
          display: flex;
          width: 100%;
          overflow: hidden;
        }

        .scroll-content {
          display: flex;
          gap: 50px;
          white-space: nowrap;
          animation: scroll 15s linear infinite;
        }

        .scroll-content span {
          padding: 0 10px;
          font-size: 15px;
          letter-spacing: 0.5px;
          text-shadow: 0 0 5px rgba(255,255,255,0.4);
        }

        /* 🔥 Smooth infinite scroll */
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* 🔥 Pause on hover */
        .scroll-container:hover .scroll-content {
          animation-play-state: paused;
        }

      `}</style>

    </div>

  )

}

export default AnnouncementBar