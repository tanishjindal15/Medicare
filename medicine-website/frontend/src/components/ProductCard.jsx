import { useContext } from "react"
import { CartContext } from "../context/CartContext"
import { useToast } from "../context/ToastContext"
import { useWishlist } from "../context/WishlistContext"
import { useAuth } from "../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { imageUrl, onImageError } from "../api"

function ProductCard({ product }) {

  const { cart, addToCart, increaseQty, decreaseQty } = useContext(CartContext)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const inCart = cart.find(item => item.id === product.id)
  const qty = inCart ? inCart.qty : 0
  const wished = isWishlisted(product.id)

  const handleAdd = () => {
    addToCart(product)
    toast(`${product.name} added to cart`, "success")
  }

  const handleWish = (e) => {
    e.preventDefault()
    if(!isLoggedIn){
      toast("Please log in to use your wishlist", "info")
      navigate("/login")
      return
    }
    toggleWishlist(product)
    toast(wished ? "Removed from wishlist" : "Added to wishlist", wished ? "info" : "success")
  }

  return (

    <div className="product-card">

      {product.category && (
        <span className="product-chip">{product.category}</span>
      )}

      <button
        className={`wish-btn ${wished ? "active" : ""}`}
        onClick={handleWish}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24"
          fill={wished ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <Link to={`/medicine/${product.id}`} className="product-link">
        <div className="product-img-wrap">
          <img
            src={imageUrl(product.image)}
            alt={product.name}
            loading="lazy"
            onError={onImageError}
          />
        </div>
        <h3>{product.name}</h3>
      </Link>

      <p className="price">₹{product.price}</p>

      {qty === 0 ? (

        <button
          className="add-btn"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>

      ) : (

        <div className="qty-stepper">
          <button onClick={() => decreaseQty(product.id)} aria-label={`Decrease ${product.name}`}>−</button>
          <span aria-live="polite">{qty}</span>
          <button onClick={() => increaseQty(product.id)} aria-label={`Increase ${product.name}`}>+</button>
        </div>

      )}

    </div>

  )
}

export default ProductCard
