function CategoryFilter({ selected, setSelected }) {

  const categories = [
    { name:"All", icon:"🧺" },
    { name:"Fever", icon:"🌡️" },
    { name:"Pain", icon:"💊" },
    { name:"Cold", icon:"🤧" },
    { name:"Diabetes", icon:"🩸" },
    { name:"Vitamins", icon:"🍊" }
  ]

  return (

    <div className="category-filter" role="tablist" aria-label="Medicine categories">

      {categories.map(cat => (

        <button
          key={cat.name}
          role="tab"
          aria-selected={selected === cat.name}
          className={selected === cat.name ? "active" : ""}
          onClick={()=>setSelected(cat.name)}
        >
          <span aria-hidden="true">{cat.icon}</span> {cat.name}
        </button>

      ))}

    </div>

  )
}

export default CategoryFilter
