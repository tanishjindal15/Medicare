import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, lazy, Suspense } from "react"

// Small layout pieces stay eager (they show on every page)
import Navbar from "./components/Navbar"
import AdminRoute from "./components/AdminRoute"
import ProtectedRoute from "./components/ProtectedRoute"
import AnnouncementBar from "./components/AnnouncementBar"
import ScrollToTop from "./components/ScrollToTop"

// Pages are code-split so each route loads only when visited
const Home = lazy(() => import("./pages/Home"))
const Login = lazy(() => import("./pages/Login"))
const Signup = lazy(() => import("./pages/Signup"))
const Cart = lazy(() => import("./pages/Cart"))
const Checkout = lazy(() => import("./pages/Checkout"))
const Admin = lazy(() => import("./pages/Admin"))
const MedicineDetails = lazy(() => import("./pages/MedicineDetails"))
const Orders = lazy(() => import("./pages/Orders"))
const AdminOrders = lazy(() => import("./pages/AdminOrders"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"))
const Profile = lazy(() => import("./pages/Profile"))
const NotFound = lazy(() => import("./pages/NotFound"))
const Wishlist = lazy(() => import("./pages/Wishlist"))

function App() {

  const [search,setSearch] = useState("")

  return (

    <BrowserRouter>

      <a href="#main" className="skip-link">Skip to content</a>

      <Suspense fallback={<div className="route-loading">Loading…</div>}>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <>
              <Navbar search={search} setSearch={setSearch}/>
              <AnnouncementBar/>
              <Home search={search}/>
            </>
          }
        />

        {/* LOGIN */}
        <Route path="/login" element={<Login/>} />

        {/* SIGNUP */}
        <Route path="/signup" element={<Signup/>} />

        {/* FORGOT PASSWORD */}
        <Route path="/forgot-password" element={<ForgotPassword/>} />

        {/* 🔥 PROFILE (FIXED) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Profile/>
              </>
            </ProtectedRoute>
          }
        />

        {/* DELETE ACCOUNT */}
        <Route
          path="/delete-account"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <DeleteAccount/>
              </>
            </ProtectedRoute>
          }
        />

        {/* CART */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Cart/>
              </>
            </ProtectedRoute>
          }
        />

        {/* CHECKOUT */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Checkout/>
              </>
            </ProtectedRoute>
          }
        />

        {/* WISHLIST (requires login) */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Wishlist/>
              </>
            </ProtectedRoute>
          }
        />

        {/* MEDICINE DETAILS */}
        <Route
          path="/medicine/:id"
          element={
            <>
              <Navbar search={search} setSearch={setSearch}/>
              <MedicineDetails/>
            </>
          }
        />

        {/* USER ORDERS */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Orders/>
              </>
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <Admin/>
              </>
            </AdminRoute>
          }
        />

        {/* ADMIN ORDERS */}
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <>
                <Navbar search={search} setSearch={setSearch}/>
                <AdminOrders/>
              </>
            </AdminRoute>
          }
        />

        {/* 404 CATCH-ALL */}
        <Route
          path="*"
          element={
            <>
              <Navbar search={search} setSearch={setSearch}/>
              <NotFound/>
            </>
          }
        />

      </Routes>
      </Suspense>

      <ScrollToTop />

    </BrowserRouter>

  )

}

export default App