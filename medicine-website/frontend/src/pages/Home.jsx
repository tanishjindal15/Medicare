import OrderOptions from "../components/OrderOptions"
import ProductSection from "../components/ProductSection"
import Footer from "../components/Footer"
import Hero from "../components/Hero"

function Home({ search }) {

  const searching = search.trim().length > 0

  return (
    <div>

      <main id="main">

        {/* When searching, show results first so the medicine is at the top */}
        {searching ? (
          <ProductSection search={search} />
        ) : (
          <>
            <Hero />
            <OrderOptions />
            <ProductSection search={search} />
          </>
        )}

      </main>

      <Footer />

    </div>
  )
}

export default Home
