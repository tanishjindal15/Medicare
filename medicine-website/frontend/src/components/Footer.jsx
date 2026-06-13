import { Link } from "react-router-dom"

function Footer(){

  return(

    <footer className="footer">

      <div className="footer-grid">

        <div>
          <div className="footer-brand">Medicare</div>
          <p>Your trusted online pharmacy.<br/>Genuine medicines, delivered fast.</p>
        </div>

        <div>
          <h4>Shop</h4>
          <Link to="/">All Medicines</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div>
          <h4>Account</h4>
          <Link to="/profile">Profile</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <p>📞 +91 99999 99999</p>
          <p>📧 support@medicare.com</p>
          <p>🕒 Mon–Sun, 8am–10pm</p>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Medicare. For demonstration purposes only — not a real pharmacy.
      </div>

    </footer>

  )

}

export default Footer
