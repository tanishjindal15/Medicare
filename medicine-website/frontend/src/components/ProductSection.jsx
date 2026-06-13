import { useState, useEffect } from "react"
import api from "../api"
import ProductCard from "./ProductCard"
import CategoryFilter from "./CategoryFilter"

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" }
]

function ProductSection({ search }) {

  const [products,setProducts] = useState([])
  const [category,setCategory] = useState("All")
  const [loading,setLoading] = useState(true)
  const [sort,setSort] = useState("featured")
  const [maxPrice,setMaxPrice] = useState(0)      // 0 = no limit (set once products load)
  const [priceCap,setPriceCap] = useState(0)

  useEffect(()=>{

    const fetchMedicines = async () => {

      try{
        const res = await api.get("/api/medicines")
        setProducts(res.data)
        // Initialise the price slider to the most expensive item
        const highest = res.data.reduce((m,p)=> Math.max(m, p.price || 0), 0)
        setMaxPrice(highest)
        setPriceCap(highest)
      }catch(err){
        console.log(err)
      }finally{
        setLoading(false)
      }

    }

    fetchMedicines()

  },[])

  const query = search.trim().toLowerCase()
  const searching = query.length > 0

  const filteredProducts = products
    .filter(product => {

      const matchSearch =
        product.name.toLowerCase().includes(query)

      const matchCategory =
        category === "All" || product.category === category

      const matchPrice =
        priceCap === 0 || product.price <= priceCap

      return matchSearch && matchCategory && matchPrice

    })
    .sort((a,b) => {

      // When searching, surface the closest matches first
      if(searching){
        const aStarts = a.name.toLowerCase().startsWith(query) ? 0 : 1
        const bStarts = b.name.toLowerCase().startsWith(query) ? 0 : 1
        if(aStarts !== bStarts) return aStarts - bStarts
      }

      switch(sort){
        case "price-asc":  return a.price - b.price
        case "price-desc": return b.price - a.price
        case "name":       return a.name.localeCompare(b.name)
        default:           return 0
      }

    })

  return(

    <div className="product-section">

      <h2>
        {searching
          ? `Search results for "${search.trim()}"`
          : "Popular Medicines"}
      </h2>

      {/* CATEGORIES + SORT CONTROLS ON ONE LINE */}
      <div className="catalog-toolbar">

        <CategoryFilter
          selected={category}
          setSelected={setCategory}
        />

        {!loading && products.length > 0 && (
          <div className="catalog-controls">
            <label className="control-sort">
              <span>Sort</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}>
                {SORT_OPTIONS.map(o=>(
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            {maxPrice > 0 && (
              <label className="control-price">
                <span>Max ₹{priceCap}</span>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceCap}
                  onChange={e=>setPriceCap(Number(e.target.value))}
                />
              </label>
            )}

            <span className="control-count">{filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}</span>
          </div>
        )}

      </div>

      {loading ? (

        <div className="product-grid">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="product-card skeleton-card">
              <div className="skeleton skeleton-img"></div>
              <div className="skeleton skeleton-line"></div>
              <div className="skeleton skeleton-line short"></div>
              <div className="skeleton skeleton-btn"></div>
            </div>
          ))}
        </div>

      ) : filteredProducts.length === 0 ? (

        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <p>
            {searching
              ? `No medicines match "${search.trim()}".`
              : category !== "All"
                ? `No medicines in “${category}” yet.`
                : "No medicines found."}
          </p>
          {category !== "All" && !searching && (
            <button className="btn btn-secondary btn-sm" onClick={()=>setCategory("All")}>
              View all medicines
            </button>
          )}
        </div>

      ) : (

        <div className="product-grid">

          {filteredProducts.map(product => (

            <ProductCard
              key={product._id}
              product={{
                id:product._id,
                name:product.name,
                price:product.price,
                image:product.image,
                category:product.category
              }}
            />

          ))}

        </div>

      )}

    </div>

  )

}

export default ProductSection