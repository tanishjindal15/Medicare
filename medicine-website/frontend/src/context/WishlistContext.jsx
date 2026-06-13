import { createContext, useContext, useState, useEffect } from "react"

export const WishlistContext = createContext()

export const useWishlist = () => useContext(WishlistContext)

function WishlistProvider({ children }) {

  /* Persist the wishlist across refreshes, like the cart */
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("wishlist")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist))
  }, [wishlist])

  const isWishlisted = (id) => wishlist.some(item => item.id === id)

  const toggleWishlist = (product) => {
    setWishlist(list =>
      list.some(item => item.id === product.id)
        ? list.filter(item => item.id !== product.id)
        : [...list, product]
    )
  }

  const removeFromWishlist = (id) => {
    setWishlist(list => list.filter(item => item.id !== id))
  }

  const clearWishlist = () => setWishlist([])

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        count: wishlist.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export default WishlistProvider
