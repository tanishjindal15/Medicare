import { createContext, useState, useEffect } from "react"

export const CartContext = createContext()

function CartProvider({ children }) {

  /* Load any previously saved cart so a refresh / login reload keeps it */
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  /* Persist the cart whenever it changes */
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (product) => {

    const exists = cart.find(item => item.id === product.id)

    if (exists) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }

  }

  const increaseQty = (id) => {
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, qty: item.qty + 1 }
        : item
    ))
  }

  const decreaseQty = (id) => {

    setCart(cart
      .map(item =>
        item.id === id
          ? { ...item, qty: item.qty - 1 }
          : item
      )
      .filter(item => item.qty > 0)
    )

  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  /* ✅ ADD THIS FUNCTION */

  const clearCart = () => {
    setCart([])
  }

  const totalPrice = cart.reduce(
    (total,item)=> total + item.price * item.qty,
    0
  )

  /* Total number of units in the cart (sum of quantities) */
  const itemCount = cart.reduce(
    (count,item)=> count + item.qty,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        removeFromCart,
        clearCart,
        totalPrice,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider