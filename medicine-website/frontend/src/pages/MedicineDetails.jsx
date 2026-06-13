import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState, useContext } from "react"
import api, { imageUrl, onImageError } from "../api"
import { CartContext } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../context/AuthContext"

function MedicineDetails(){

  const { id } = useParams()
  const navigate = useNavigate()
  const { cart, addToCart, increaseQty, decreaseQty } = useContext(CartContext)
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isLoggedIn } = useAuth()
  const toast = useToast()

  const [medicine,setMedicine] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    const fetchMedicine = async()=>{

      try{
        const res = await api.get(`/api/medicines/${id}`)
        setMedicine(res.data)
      }catch(err){
        console.log(err)
      }finally{
        setLoading(false)
      }

    }

    fetchMedicine()

  },[id])

  if(loading) return (
    <div className="medicine-details">
      <div className="skeleton" style={{width:"100%",maxWidth:"360px",height:"360px",borderRadius:"var(--radius)"}} />
      <div className="medicine-info" style={{flex:1}}>
        <div className="skeleton skeleton-line" style={{height:"28px",width:"60%"}} />
        <div className="skeleton skeleton-line" style={{height:"22px",width:"30%"}} />
        <div className="skeleton skeleton-line" style={{width:"40%"}} />
        <div className="skeleton skeleton-line" style={{width:"90%"}} />
        <div className="skeleton skeleton-line" style={{width:"80%"}} />
        <div className="skeleton skeleton-btn" style={{maxWidth:"200px"}} />
      </div>
    </div>
  )

  if(!medicine) return (
    <div className="empty-state" style={{padding:"80px 20px"}}>
      <div className="empty-emoji">💊</div>
      <p>Sorry, we couldn’t find that medicine.</p>
      <Link to="/" className="checkout-btn" style={{maxWidth:"220px",margin:"16px auto 0"}}>
        Back to Home
      </Link>
    </div>
  )

  const inCart = cart.find(item => item.id === medicine._id)
  const qty = inCart ? inCart.qty : 0
  const wished = isWishlisted(medicine._id)

  const product = {
    id: medicine._id,
    name: medicine.name,
    price: medicine.price,
    image: medicine.image,
    category: medicine.category
  }

  return(

    <div className="details-page">

      <Link to="/" className="back-link">← Back to medicines</Link>

      <div className="medicine-details">

        <div className="details-img-wrap">
          <img
            src={imageUrl(medicine.image)}
            alt={medicine.name}
            onError={onImageError}
          />
          <button
            className={`wish-btn details-wish ${wished ? "active" : ""}`}
            onClick={() => {
              if(!isLoggedIn){
                toast("Please log in to use your wishlist", "info")
                navigate("/login")
                return
              }
              toggleWishlist(product)
              toast(wished ? "Removed from wishlist" : "Added to wishlist", wished ? "info" : "success")
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            <HeartIcon filled={wished} />
          </button>
        </div>

        <div className="medicine-info">

          {medicine.category && <span className="category-badge">{medicine.category}</span>}

          <h2>{medicine.name}</h2>

          <p className="price">₹{medicine.price}</p>

          <p className="medicine-description">
            {medicine.description}
          </p>

          {qty === 0 ? (
            <button className="add-btn details-add" onClick={() => {
              addToCart(product)
              toast(`${medicine.name} added to cart`, "success")
            }}>
              Add to Cart
            </button>
          ) : (
            <div className="qty-stepper" style={{maxWidth:"180px"}}>
              <button onClick={() => decreaseQty(medicine._id)} aria-label="decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => increaseQty(medicine._id)} aria-label="increase">+</button>
            </div>
          )}

          <div className="details-trust">
            <div className="dt-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>
              100% Genuine
            </div>
            <div className="dt-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Fast Delivery
            </div>
            <div className="dt-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Cash on Delivery
            </div>
          </div>

        </div>

      </div>

    </div>

  )
}

/* Heart icon used for the wishlist toggle */
function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

export default MedicineDetails
