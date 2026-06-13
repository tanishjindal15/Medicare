import { useState, useEffect } from "react"

function ScrollToTop(){

  const [show,setShow] = useState(false)

  useEffect(()=>{
    const onScroll = ()=> setShow(window.scrollY > 400)
    window.addEventListener("scroll", onScroll)
    return ()=> window.removeEventListener("scroll", onScroll)
  },[])

  if(!show) return null

  return(
    <button
      className="scroll-top"
      onClick={()=>window.scrollTo({ top:0, behavior:"smooth" })}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  )
}

export default ScrollToTop
