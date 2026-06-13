import { useState, useContext, useEffect, useRef } from "react"
import axios from "axios"
import { QRCodeSVG } from "qrcode.react"
import api from "../api"
import { CartContext } from "../context/CartContext"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import AddressBook from "../components/AddressBook"
import { validateAddress } from "../utils/validation"
import { UPI_ENABLED, UPI_PAYEE_NAME, UPI_QR_IMAGE, buildUpiLink } from "../config"

function Checkout(){

  const { cart, totalPrice, clearCart } = useContext(CartContext)
  const { name:authName, phone:authPhone } = useAuth()
  const toast = useToast()

  const navigate = useNavigate()

  const [form,setForm] = useState({
    name:"", phone:"", street:"", city:"", state:"", pincode:""
  })
  const [selectedId,setSelectedId] = useState(null)
  const [errors,setErrors] = useState({})
  const [loading,setLoading] = useState(false)
  const [paymentMethod,setPaymentMethod] = useState("COD")
  const [paymentRef,setPaymentRef] = useState("")

  /* Pre-fill name & phone from the signed-in user */
  useEffect(()=>{
    setForm(prev=>({
      ...prev,
      name: prev.name || authName || "",
      phone: prev.phone || authPhone || ""
    }))
  },[authName,authPhone])

  const setField = (k,v)=>{
    setForm(prev=>({ ...prev, [k]:v }))
    setSelectedId(null) // manual edits mean a (potentially) new address
  }

  /* Fill the form from a saved address chosen in the AddressBook */
  const useSavedAddress = (addr)=>{
    setForm({
      name:addr.name, phone:addr.phone, street:addr.street,
      city:addr.city, state:addr.state, pincode:addr.pincode
    })
    setSelectedId(addr._id)
    setErrors({})
  }

  /* Reverse-geocode the current location into the form */
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported", "error")
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            { params:{ lat:latitude, lon:longitude, format:"json" } }
          )
          const data = res.data.address
          setForm(prev=>({
            ...prev,
            street: data.road || data.suburb || "",
            city: data.city || data.town || data.village || "",
            state: data.state || "",
            pincode: data.postcode || ""
          }))
          setSelectedId(null)
          toast("Location filled in", "success")
        } catch {
          toast("Failed to fetch location", "error")
        }
      },
      () => toast("Location permission denied", "error")
    )
  }

  const placeOrder = async(e)=>{

    if(e?.preventDefault) e.preventDefault()
    if(loading) return

    if(cart.length === 0){
      toast("Your cart is empty", "error")
      return
    }

    const errs = validateAddress(form)
    setErrors(errs)
    if(Object.keys(errs).length) return

    // For online payment, make sure it's configured and a reference is provided
    if(paymentMethod === "UPI"){
      if(!UPI_ENABLED){
        toast("Online payment isn't available yet — please choose Cash on Delivery", "error")
        return
      }
      if(!paymentRef.trim()){
        toast("Please pay via the QR, then enter the UPI transaction reference", "error")
        return
      }
    }

    setLoading(true)

    try{

      const res = await api.post("/api/orders", {
        products: cart,
        total: totalPrice,
        address: form,
        paymentMethod,
        paymentRef: paymentMethod === "UPI" ? paymentRef.trim() : ""
      })

      if(res.data && res.data.message === "Order created"){

        // Save the address for future use only if it wasn't a saved one
        if(!selectedId){
          try{ await api.post("/api/address", form) }catch{ /* non-fatal */ }
        }

        clearCart()
        toast("Order placed successfully!", "success")
        navigate("/orders")
      }

    }catch(err){
      setErrors({ form: err.response?.data?.message || "Order failed" })
    }finally{
      setLoading(false)
    }

  }

  /* Press Enter to place the order even when focus isn't in a text field
     (e.g. after picking a saved address). Text inputs already submit via the form.
     A ref keeps the latest placeOrder so we attach the listener only once. */
  const placeOrderRef = useRef(placeOrder)
  placeOrderRef.current = placeOrder

  useEffect(()=>{
    const onKey = (e)=>{
      if(e.key !== "Enter") return
      const tag = document.activeElement?.tagName
      // Inputs submit through the form; buttons/selects use Enter themselves
      if(["INPUT","BUTTON","SELECT","TEXTAREA","A"].includes(tag)) return
      placeOrderRef.current()
    }
    window.addEventListener("keydown", onKey)
    return ()=>window.removeEventListener("keydown", onKey)
  },[])

  return(

    <div className="checkout-page">

      <h2>Checkout</h2>

      <div className="checkout-grid">

        {/* LEFT: ADDRESS */}
        <div className="checkout-card">

          {/* Saved addresses (select / add / edit / delete) */}
          <AddressBook onUse={useSavedAddress} selectedId={selectedId} />

          <hr style={{border:"none", borderTop:"1px solid var(--border)", margin:"20px 0"}}/>

          <h3>Delivery Details</h3>

          {errors.form && <div className="form-error-box">{errors.form}</div>}

          <form onSubmit={placeOrder} noValidate>

            <button type="button" className="btn btn-accent btn-sm" onClick={getLocation} style={{marginBottom:"16px"}}>
              📍 Use Current Location
            </button>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input className="input" value={form.name} onChange={(e)=>setField("name",e.target.value)} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="input" value={form.phone} onChange={(e)=>setField("phone",e.target.value)} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <input className="input" value={form.street} onChange={(e)=>setField("street",e.target.value)} />
              {errors.street && <span className="field-error">{errors.street}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input className="input" value={form.city} onChange={(e)=>setField("city",e.target.value)} />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>State</label>
                <input className="input" value={form.state} onChange={(e)=>setField("state",e.target.value)} />
                {errors.state && <span className="field-error">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input className="input" value={form.pincode} onChange={(e)=>setField("pincode",e.target.value)} />
                {errors.pincode && <span className="field-error">{errors.pincode}</span>}
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading} style={{width:"100%"}}>
              {loading
                ? "Placing..."
                : paymentMethod === "UPI"
                  ? "I've Paid — Place Order"
                  : "Place Order"}
            </button>

          </form>

        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="checkout-card">

          <h3>Order Summary</h3>

          {cart.length === 0 ? (
            <p style={{color:"var(--muted)"}}>Your cart is empty.</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}

              <div className="summary-total">
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>

              {/* PAYMENT METHOD */}
              <h4 style={{margin:"22px 0 10px"}}>Payment Method</h4>

              <div className="pay-methods">
                <label className={`pay-option ${paymentMethod === "COD" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "COD"}
                    onChange={()=>setPaymentMethod("COD")}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>

                <label className={`pay-option ${paymentMethod === "UPI" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "UPI"}
                    onChange={()=>setPaymentMethod("UPI")}
                  />
                  <span>📱 Pay Online (UPI)</span>
                </label>
              </div>

              {paymentMethod === "UPI" && (
                <div className="upi-pay">
                  {UPI_ENABLED ? (
                    <>
                      <div className="upi-qr">
                        {UPI_QR_IMAGE ? (
                          <img src={UPI_QR_IMAGE} alt="UPI QR code" width={200} height={200} style={{objectFit:"contain"}} />
                        ) : (
                          <QRCodeSVG
                            value={buildUpiLink({ amount: totalPrice })}
                            size={190}
                            marginSize={2}
                            level="M"
                          />
                        )}
                      </div>
                      <p className="upi-amount">Pay <b>₹{totalPrice}</b> to {UPI_PAYEE_NAME}</p>
                      <p className="muted" style={{marginTop:"2px"}}>
                        Scan with any UPI app — GPay, PhonePe, Paytm…
                      </p>
                      <div className="form-group" style={{marginTop:"14px"}}>
                        <label>UPI Transaction Reference</label>
                        <input
                          className="input"
                          value={paymentRef}
                          onChange={(e)=>setPaymentRef(e.target.value)}
                          placeholder="Enter the UTR / ref no. after paying"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="form-error-box">
                      Online payment isn’t configured yet. Please choose Cash on Delivery.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>

  )

}

export default Checkout
