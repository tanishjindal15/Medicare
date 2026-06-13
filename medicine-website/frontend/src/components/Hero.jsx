import banner from "../assets/banner.png"

function Hero(){

  return(

    <section className="hero-band">

      <div className="hero-text">
        <span className="hero-eyebrow">🩺 Trusted Online Pharmacy</span>
        <h1>Health essentials,<br/><span>delivered to your door</span></h1>
        <p>Genuine medicines, wellness products and daily care — at the best prices, delivered fast.</p>

        <div className="hero-trust">
          <span>✓ 100% Genuine</span>
          <span>🚚 Fast Delivery</span>
          <span>💵 Cash on Delivery</span>
        </div>
      </div>

      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${banner})` }}
        aria-hidden="true"
      />

    </section>

  )
}

export default Hero
