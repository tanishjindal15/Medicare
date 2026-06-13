import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import CartProvider from "./context/CartContext.jsx"
import AuthProvider from "./context/AuthContext.jsx"
import ToastProvider from "./context/ToastContext.jsx"
import WishlistProvider from "./context/WishlistContext.jsx"
import ConfirmProvider from "./context/ConfirmContext.jsx"

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ToastProvider>
      <ConfirmProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </ConfirmProvider>
    </ToastProvider>
  </AuthProvider>
)