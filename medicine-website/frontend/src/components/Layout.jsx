import Navbar from "./Navbar"

function Layout({ children, search, setSearch }) {
  return (
    <>
      <Navbar search={search} setSearch={setSearch} />
      {children}
    </>
  )
}

export default Layout