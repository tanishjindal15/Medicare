import { Link, NavLink, useNavigate } from "react-router-dom"
import { useContext, useState, useEffect, useRef } from "react"
import { CartContext } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useWishlist } from "../context/WishlistContext"

/* Reusable dropdown row with hover state */
function MenuItem({ icon, label, onClick, danger }) {

  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        display:"flex",
        alignItems:"center",
        gap:"12px",
        width:"100%",
        padding:"10px 12px",
        border:"none",
        borderRadius:"8px",
        background: hover ? (danger ? "#fef2f2" : "#f3f4f6") : "transparent",
        color: danger ? "#dc2626" : "#374151",
        fontSize:"14px",
        fontWeight:500,
        cursor:"pointer",
        textAlign:"left",
        transition:"background 0.15s ease"
      }}
    >
      <span style={{display:"flex", color: danger ? "#dc2626" : "#6b7280"}}>{icon}</span>
      {label}
    </button>
  )
}

/* Inline SVG icons (24x24 stroke) */
const icon = {
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function Navbar({ search, setSearch }) {

  const { itemCount } = useContext(CartContext)
  const { count: wishCount } = useWishlist()
  const { token, name, role, logout: authLogout } = useAuth()

  const navigate = useNavigate()

  const [menuOpen,setMenuOpen] = useState(false)

  const menuRef = useRef()

  const logout = () => {
    authLogout()
    setMenuOpen(false)
    navigate("/")
  }

  /* 🔥 CLOSE MENU ON OUTSIDE CLICK */
  useEffect(() => {

    const handleClickOutside = (e) => {
      if(menuRef.current && !menuRef.current.contains(e.target)){
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }

  }, [])

  return (

    <nav className="navbar">

      {/* LOGO */}
      <div className="logo">
        <Link to="/">Medicare</Link>
      </div>

      {/* SEARCH */}
      <div className="search">
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-links">

        {token ? (

          <>

            <span>Hello {name}</span>

            {/* WISHLIST (logged-in only) */}
            <Link to="/wishlist" className="nav-wish" aria-label="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wishCount > 0 && <span className="nav-badge">{wishCount}</span>}
            </Link>

            {/* CART */}
            <NavLink to="/cart">
              Cart 🛒 ({itemCount})
            </NavLink>

            {/* ADMIN */}
            {role === "admin" && (
              <>
                <NavLink to="/admin" end>Admin</NavLink>
                <NavLink to="/admin/orders">Orders</NavLink>
              </>
            )}

            {/* 🍔 MENU */}
            <div ref={menuRef} style={{position:"relative"}}>

              <div
                onClick={()=>setMenuOpen(!menuOpen)}
                style={{
                  fontSize:"22px",
                  cursor:"pointer",
                  padding:"5px"
                }}
              >
                ☰
              </div>

              {/* DROPDOWN */}
              <div
                style={{
                  position:"absolute",
                  right:0,
                  top:"48px",
                  background:"#fff",
                  border:"1px solid #e5e7eb",
                  borderRadius:"12px",
                  width:"240px",
                  boxShadow:"0 10px 30px rgba(0,0,0,0.12)",
                  padding:"6px",
                  zIndex:50,

                  /* 🔥 ANIMATION */
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
                  pointerEvents: menuOpen ? "auto" : "none",
                  transition:"all 0.18s ease"
                }}
              >

                {/* USER HEADER */}
                <div style={{padding:"10px 12px 12px"}}>
                  <div style={{fontSize:"13px", color:"#9ca3af"}}>Signed in as</div>
                  <div style={{fontSize:"15px", fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {name}
                  </div>
                </div>

                <div style={{height:"1px", background:"#f0f0f0", margin:"0 4px 6px"}} />

                <MenuItem
                  icon={icon.profile}
                  label="Profile"
                  onClick={()=>{ setMenuOpen(false); navigate("/profile") }}
                />

                <MenuItem
                  icon={icon.orders}
                  label="Orders"
                  onClick={()=>{ setMenuOpen(false); navigate("/orders") }}
                />

                <div style={{height:"1px", background:"#f0f0f0", margin:"6px 4px"}} />

                <MenuItem
                  icon={icon.trash}
                  label="Delete Account"
                  danger
                  onClick={()=>{ setMenuOpen(false); navigate("/delete-account") }}
                />

                <MenuItem
                  icon={icon.logout}
                  label="Logout"
                  onClick={logout}
                />

              </div>

            </div>

          </>

        ) : (

          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>

        )}

      </div>

    </nav>

  )

}

export default Navbar