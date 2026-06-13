import { Link } from "react-router-dom"
import { useContext } from "react"
import { useWishlist } from "../context/WishlistContext"
import { CartContext } from "../context/CartContext"
import { useToast } from "../context/ToastContext"
import { imageUrl, onImageError } from "../api"
import Footer from "../components/Footer"

function Wishlist() {

  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useContext(CartContext)
  const toast = useToast()

  const moveToCart = (item) => {
    addToCart(item)
    removeFromWishlist(item.id)
    toast(`${item.name} moved to cart`, "success")
  }

  return (
    <>
      <main id="main" className="wishlist-page">

        <div className="wishlist-head">
          <h2>My Wishlist {wishlist.length > 0 && <span className="wishlist-count">{wishlist.length}</span>}</h2>
          {wishlist.length > 0 && (
            <button className="link-danger" onClick={clearWishlist}>Clear all</button>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="empty-state" style={{ padding: "70px 20px" }}>
            <div className="empty-emoji">❤️</div>
            <p>Your wishlist is empty.</p>
            <Link to="/" className="checkout-btn" style={{ maxWidth: "240px", margin: "16px auto 0" }}>
              Browse Medicines
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map(item => (
              <div className="wishlist-card" key={item.id}>
                <Link to={`/medicine/${item.id}`} className="product-link">
                  <div className="product-img-wrap">
                    <img src={imageUrl(item.image)} alt={item.name} onError={onImageError} />
                  </div>
                  <h3>{item.name}</h3>
                </Link>
                <p className="price">₹{item.price}</p>
                <div className="wishlist-actions">
                  <button className="add-btn" onClick={() => moveToCart(item)}>Move to Cart</button>
                  <button className="link-danger" onClick={() => removeFromWishlist(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}

export default Wishlist
