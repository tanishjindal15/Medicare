import { useEffect,useState,useCallback } from "react"
import { Link } from "react-router-dom"
import api from "../api"
import { useToast } from "../context/ToastContext"
import { useConfirm } from "../context/ConfirmContext"

/* Show the same friendly labels the admin uses */
const STATUS_LABEL = {
  Pending: "Pending",
  Shipped: "Shipped",
  Success: "Delivered",
  Cancelled: "Cancelled"
}

/* Customers may cancel a pending order only within 5 minutes of placing it */
const CANCEL_WINDOW_MS = 5 * 60 * 1000

const remainingMs = (order, now) =>
  CANCEL_WINDOW_MS - (now - new Date(order.createdAt).getTime())

const canCancel = (order, now) =>
  order.status === "Pending" && remainingMs(order, now) > 0

/* Format the remaining cancel time as m:ss */
const fmtRemaining = (order, now) => {
  const total = Math.ceil(Math.max(0, remainingMs(order, now)) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function Orders(){

  const [orders,setOrders] = useState([])
  const [now,setNow] = useState(()=>Date.now())
  const toast = useToast()
  const confirm = useConfirm()

  /* Tick every second so the cancel countdown stays live */
  useEffect(()=>{
    const t = setInterval(()=>setNow(Date.now()), 1000)
    return ()=>clearInterval(t)
  },[])

  const fetchOrders = useCallback(async()=>{

    try{

      const res = await api.get("/api/orders/my-orders")

      setOrders(res.data)

    }catch(err){

      console.log(err)

    }

  },[])

  const cancelOrder = async(id)=>{

    const ok = await confirm({
      title:"Cancel this order?",
      message:"Your order will be cancelled. This can't be undone.",
      confirmText:"Yes, cancel",
      cancelText:"Keep order",
      danger:true
    })
    if(!ok) return

    try{

      await api.put(`/api/orders/${id}/cancel`)
      toast("Order cancelled", "success")
      fetchOrders()

    }catch(err){

      toast(err.response?.data?.message || "Could not cancel order", "error")

    }

  }

  /* Colour for the status badge */
  const statusColor = (status)=>{
    if(status === "Success") return "#28a745"
    if(status === "Shipped") return "#2c7be5"
    if(status === "Cancelled") return "#dc3545"
    return "#ff9800" // Pending
  }

  /* Keep orders live: fetch on mount, when the tab regains focus, and poll
     periodically — so an admin's status change shows up without a manual refresh */
  useEffect(()=>{

    (async()=>{ await fetchOrders() })()

    const refetchIfVisible = ()=>{
      if(document.visibilityState === "visible") fetchOrders()
    }

    window.addEventListener("focus", refetchIfVisible)
    document.addEventListener("visibilitychange", refetchIfVisible)

    const interval = setInterval(refetchIfVisible, 15000)

    return ()=>{
      window.removeEventListener("focus", refetchIfVisible)
      document.removeEventListener("visibilitychange", refetchIfVisible)
      clearInterval(interval)
    }

  },[fetchOrders])

  return(

    <div className="orders-page">

      <h2>Your Orders</h2>

      {orders.length === 0 && (
        <div className="orders-empty">
          <div className="empty-emoji">📦</div>
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="btn" style={{maxWidth:"220px", margin:"8px auto 0"}}>
            Start Shopping
          </Link>
        </div>
      )}

      {orders.map(order=>(

        <div key={order._id} className="user-order">

          <div className="user-order-top">
            <div>
              <h4>Order #{order._id.slice(-6).toUpperCase()}</h4>
              <span className="order-meta">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <span
              className="status-badge"
              style={{background:statusColor(order.status)}}
            >
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>

          <div className="user-order-grid">

            <section>
              <h5>Items ({order.products.length})</h5>
              <ul className="uo-items">
                {order.products.map((item,i)=>(
                  <li key={i}>
                    <span>{item.name} × {item.qty}</span>
                    <span>₹{item.price * item.qty}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h5>Delivery Address</h5>
              <p className="muted">
                {order.address?.name}<br/>
                {order.address?.street}<br/>
                {order.address?.city}, {order.address?.state} {order.address?.pincode}<br/>
                📞 {order.address?.phone}
              </p>
            </section>

          </div>

          <div className="user-order-foot">
            <div>
              <b>Total: ₹{order.total}</b>
              <span className="muted"> · {order.paymentMethod} · {order.paymentStatus}</span>
            </div>

            {order.status === "Pending" && (
              canCancel(order, now) ? (
                <div className="cancel-area">
                  <span className="cancel-timer">⏳ {fmtRemaining(order, now)} left to cancel</span>
                  <button className="cancel-order-btn" onClick={()=>cancelOrder(order._id)}>
                    Cancel Order
                  </button>
                </div>
              ) : (
                <span className="order-meta" style={{fontStyle:"italic"}}>
                  Cancellation window closed
                </span>
              )
            )}
          </div>

        </div>

      ))}

    </div>

  )

}

export default Orders