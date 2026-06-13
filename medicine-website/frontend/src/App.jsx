import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from "react"

import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Admin from "./pages/Admin"
import AdminRoute from "./components/AdminRoute"
import ProtectedRoute from "./components/ProtectedRoute"
import AnnouncementBar from "./components/AnnouncementBar"
import MedicineDetails from "./pages/MedicineDetails"
import Orders from "./pages/Orders"
import AdminOrders from "./pages/AdminOrders"
import ForgotPassword from "./pages/ForgotPassword"
import DeleteAccount from "./pages/DeleteAccount"
import Profile from "./pages/Profile"   // ✅ IMPORTANT
import NotFound from "./pages/NotFound"
import Wishlist from "./pages/Wishlist"
import ScrollToTop from "./components/ScrollToTop"

function App() {

  const [search,setSearch] = useState("")

  return (

    <BrowserRouter>

      <a href="#main" className="skip-link">Skip to content</a>

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

      <ScrollToTop />

    </BrowserRouter>

  )

}

export default App