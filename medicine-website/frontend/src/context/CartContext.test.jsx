import { describe, it, expect } from "vitest"
import { useContext } from "react"
import { render, screen, act } from "@testing-library/react"
import CartProvider, { CartContext } from "./CartContext"

function Probe() {
  const { addToCart, increaseQty, decreaseQty, totalPrice, itemCount } = useContext(CartContext)
  const item = { id: "1", name: "Paracetamol", price: 20, image: "" }
  return (
    <div>
      <button onClick={() => addToCart(item)}>add</button>
      <button onClick={() => increaseQty("1")}>inc</button>
      <button onClick={() => decreaseQty("1")}>dec</button>
      <span data-testid="total">{totalPrice}</span>
      <span data-testid="count">{itemCount}</span>
    </div>
  )
}

const setup = () => render(<CartProvider><Probe /></CartProvider>)
const click = (label) => act(() => { screen.getByText(label).click() })

describe("CartContext math", () => {
  it("adds items and computes total + count", () => {
    setup()
    click("add")
    click("add") // same id → qty 2
    expect(screen.getByTestId("total").textContent).toBe("40")
    expect(screen.getByTestId("count").textContent).toBe("2")
  })

  it("decreasing below 1 removes the item", () => {
    setup()
    click("add")
    click("dec") // qty 1 → 0 → removed
    expect(screen.getByTestId("total").textContent).toBe("0")
    expect(screen.getByTestId("count").textContent).toBe("0")
  })
})
