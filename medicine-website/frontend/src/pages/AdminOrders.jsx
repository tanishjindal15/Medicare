import { useEffect, useState, useCallback, useRef } from "react"
import api from "../api"
import { useToast } from "../context/ToastContext"

const STATUS_LABEL = {
  Pending: "Pending",
  Shipped: "Shipped",
  Success: "Delivered",
  Cancelled: "Cancelled"
}

const FILTERS = ["All", "Pending", "Shipped", "Success", "Cancelled"]

function AdminOrders(){

  const [orders,setOrders] = useState([])
  const [filter,setFilter] = useState("All")
  const [loading,setLoading] = useState(true)
  const toast = useToast()

  // Snapshot of id -> status from the previous fetch, to detect changes
  const prevRef = useRef(null)
  // True while a status update is in flight, so polling doesn't clobber it
  const mutatingRef = useRef(false)

  const fetchOrders = useCallback(async(showError=false)=>{
    // Don't let a background poll overwrite an optimistic update mid-flight
    if(mutatingRef.current) return
    try{
      const res = await api.get("/api/orders")
      const data = res.data

      // Ping the admin about anything new since the last fetch
      if(prevRef.current){
        const prev = prevRef.current
        data.forEach(o=>{
          const id = o._id.slice(-6).toUpperCase()
          if(!(o._id in prev)){
            toast(`🔔 New order #${id} received`, "success")
          }else if(o.status === "Cancelled" && prev[o._id] !== "Cancelled"){
            toast(`❌ Order #${id} was cancelled`, "info")
          }
        })
      }

      prevRef.current = Object.fromEntries(data.map(o=>[o._id, o.status]))
      setOrders(data)
    }catch{
      if(showError) toast("Failed to load orders", "error")
    }finally{
      setLoading(false)
    }
  },[toast])

  /* Initial load, poll every 20s, and refetch when the admin returns to the
     tab — so new orders and customer cancellations ping without a refresh */
  useEffect(()=>{

    (async()=>{ await fetchOrders(true) })()

    const refetchIfVisible = ()=>{
      if(document.visibilityState === "visible") fetchOrders()
    }

    window.addEventListener("focus", refetchIfVisible)
    document.addEventListener("visibilitychange", refetchIfVisible)

    const interval = setInterval(refetchIfVisible, 20000)

    return ()=>{
      window.removeEventListener("focus", refetchIfVisible)
      document.removeEventListener("visibilitychange", refetchIfVisible)
      clearInterval(interval)
    }

  },[fetchOrders])

  /* Optimistic update: reflect instantly, persist in the background, revert on error */
  const updateStatus = async(id, status)=>{

    const snapshot = orders
    const prevStatus = snapshot.find(o => o._id === id)?.status

    setOrders(list => list.map(o =>
      o._id === id
        ? { ...o, status, paymentStatus: status === "Success" ? "Paid" : o.paymentStatus }
        : o
    ))

    // Mark this change as "known" so polling doesn't re-announce it
    if(prevRef.current) prevRef.current[id] = status
    mutatingRef.current = true

    try{
      await api.put(`/api/orders/${id}`, { status })
      toast(`Order #${id.slice(-6).toUpperCase()} → ${STATUS_LABEL[status]}`, "success")
    }catch(err){
      setOrders(snapshot) // revert
      if(prevRef.current && prevStatus) prevRef.current[id] = prevStatus
      toast(err.response?.data?.message || "Failed to update status", "error")
    }finally{
      mutatingRef.current = false
    }
  }

  const statusColor = (status)=>{
    if(status === "Success") return "#28a745"
    if(status === "Shipped") return "#2c7be5"
    if(status === "Cancelled") return "#dc3545"
    return "#ff9800" // Pending
  }

  const countFor = (key)=>
    key === "All" ? orders.length : orders.filter(o => o.status === key).length

  const visible = filter === "All"
    ? orders
    : orders.filter(o => o.status === filter)

  return(

    <main id="main" className="admin-page">

      <div className="admin-head">
        <div className="admin-head-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div>
          <h2>Order Dashboard</h2>
          <p>{orders.length} total order{orders.length !== 1 ? "s" : ""} · manage &amp; update statuses</p>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="order-tabs" role="tablist" aria-label="Filter orders by status">
        {FILTERS.map(key=>(
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? "active" : ""}
            onClick={()=>setFilter(key)}
          >
            {STATUS_LABEL[key] || "All"}
            <span className="tab-count">{countFor(key)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📦</div>
          <p>No {filter !== "All" ? STATUS_LABEL[filter].toLowerCase() : ""} orders.</p>
        </div>
      ) : (

        <div className="admin-orders-list">

          {visible.map(order=>(

            <article key={order._id} className="admin-order">

              <header className="admin-order-top">
                <div>
                  <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                  <span className="order-meta">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="status-badge" style={{background:statusColor(order.status)}}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </header>

              <div className="admin-order-grid">

                <section>
                  <h4>Customer</h4>
                  <p>{order.user?.name || order.address?.name || "—"}</p>
                  {order.user?.email && <p className="muted">{order.user.email}</p>}
                  {order.address?.phone && <p className="muted">📞 {order.address.phone}</p>}
                </section>

                <section>
                  <h4>Delivery Address</h4>
                  <p className="muted">
                    {order.address?.street}<br/>
                    {order.address?.city}, {order.address?.state}<br/>
                    {order.address?.pincode}
                  </p>
                </section>

                <section>
                  <h4>Items ({order.products?.length || 0})</h4>
                  <ul className="admin-order-items">
                    {order.products?.map((item,i)=>(
                      <li key={i}>
                        <span>{item.name} × {item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                      </li>
                    ))}
                  </ul>
                </section>

              </div>

              <footer className="admin-order-foot">
                <div className="admin-order-pay">
                  <b>Total: ₹{order.total}</b>
                  <span className="muted"> · {order.paymentMethod} · {order.paymentStatus}</span>
                  {order.paymentMethod === "UPI" && order.paymentRef && (
                    <span className="muted"> · Ref: {order.paymentRef}</span>
                  )}
                </div>

                {(order.status === "Success" || order.status === "Cancelled") ? (
                  <span className="status-locked">
                    🔒 {order.status === "Success" ? "Delivered" : "Cancelled"} — locked
                  </span>
                ) : (
                  <label className="status-update">
                    <span>Update status</span>
                    <select
                      value={order.status}
                      onChange={(e)=>updateStatus(order._id, e.target.value)}
                      aria-label={`Update status for order ${order._id.slice(-6).toUpperCase()}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Success">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>
                )}
              </footer>

            </article>

          ))}

        </div>

      )}

    </main>

  )

}

export default AdminOrders
