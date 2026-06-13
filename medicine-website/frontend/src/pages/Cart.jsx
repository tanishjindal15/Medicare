import { useContext, useEffect } from "react"
import { CartContext } from "../context/CartContext"
import { Link, useNavigate } from "react-router-dom"
import { imageUrl, onImageError } from "../api"
import { useConfirm } from "../context/ConfirmContext"

function Cart() {

  const {
    cart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    totalPrice,
    itemCount
  } = useContext(CartContext)

  const confirm = useConfirm()
  const navigate = useNavigate()

  /* Press Enter to proceed to checkout (when nothing interactive is focused) */
  useEffect(()=>{
    if(cart.length === 0) return
    const onKey = (e)=>{
      if(e.key !== "Enter") return
      const tag = document.activeElement?.tagName
      if(["BUTTON","A","INPUT","SELECT","TEXTAREA"].includes(tag)) return
      navigate("/checkout")
    }
    window.addEventListener("keydown", onKey)
    return ()=>window.removeEventListener("keydown", onKey)
  },[cart.length, navigate])

  const handleClearCart = async () => {
    const ok = await confirm({
      title: "Clear your cart?",
      message: "This removes all items from your cart.",
      confirmText: "Clear cart",
      cancelText: "Keep items",
      danger: true
    })
    if (ok) clearCart()
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h2>Your Cart</h2>
        <div className="cart-empty">
          <div className="empty-emoji">🛒</div>
          <p>Your cart is empty.</p>
          <Link to="/" className="btn" style={{ maxWidth: "240px", margin: "10px auto 0" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (

    <div className="cart-page">

      <div className="cart-page-head">
        <h2>Your Cart</h2>
        <button className="cart-clear-link" onClick={handleClearCart}>Clear Cart</button>
      </div>

      <div className="cart-layout">

        {/* LEFT — ITEMS */}
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">

              <div className="cart-thumb">
                <img src={imageUrl(item.image)} alt={item.name} onError={onImageError} />
              </div>

              <div className="cart-info">
                <h4>{item.name}</h4>
                <p>₹{item.price} each</p>

                <div className="qty-controls">
                  <button onClick={() => decreaseQty(item.id)} aria-label={`Decrease ${item.name}`}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => increaseQty(item.id)} aria-label={`Increase ${item.name}`}>+</button>
                </div>
              </div>

              <div className="cart-item-end">
                <span className="cart-line-total">₹{item.price * item.qty}</span>
                <button className="cart-remove" onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT — SUMMARY */}
        <aside className="cart-summary">
          <h3>Order Summary</h3>

          <div className="summary-line">
            <span>Items ({itemCount})</span>
            <span>₹{totalPrice}</span>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <span className="summary-free">Free</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-grand">
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>

          <Link to="/checkout">
            <button className="btn cart-checkout-btn">Proceed to Checkout</button>
          </Link>

          <Link to="/" className="cart-continue">← Continue shopping</Link>
        </aside>

      </div>

    </div>

  )
}

export default Cart
