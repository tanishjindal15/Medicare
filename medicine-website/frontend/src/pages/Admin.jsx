import { useState, useEffect } from "react"
import api, { imageUrl, onImageError } from "../api"
import { useToast } from "../context/ToastContext"
import { useConfirm } from "../context/ConfirmContext"

function Admin(){

  const toast = useToast()
  const confirm = useConfirm()

  /* ------------------ STATS ------------------ */

  const [stats,setStats] = useState({
    totalOrders:0,
    totalUsers:0,
    totalRevenue:0
  })

  const fetchStats = async()=>{
    try{
      const res = await api.get("/api/admin/stats")
      setStats(res.data)
    }catch(err){
      console.log(err)
    }
  }

  /* ------------------ MEDICINES ------------------ */

  const [name,setName] = useState("")
  const [price,setPrice] = useState("")
  const [image,setImage] = useState(null)
  const [category,setCategory] = useState("")
  const [description,setDescription] = useState("")

  const [preview,setPreview] = useState(null)

  const [medicines,setMedicines] = useState([])
  const [editingId,setEditingId] = useState(null)
  const [saving,setSaving] = useState(false)

  const fetchMedicines = async()=>{
    try{
      const res = await api.get("/api/medicines")
      setMedicines(res.data)
    }catch(err){
      console.log(err)
    }
  }

  useEffect(()=>{
    (async()=>{
      await fetchMedicines()
      await fetchStats()
    })()
  },[])

  const handleImageChange = (e)=>{
    const file = e.target.files[0]
    setImage(file)
    if(file) setPreview(URL.createObjectURL(file))
  }

  const resetForm = ()=>{
    setName(""); setPrice(""); setImage(null)
    setCategory(""); setDescription(""); setPreview(null)
    setEditingId(null)
  }

  const addMedicine = async(e)=>{
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append("name",name)
    formData.append("price",price)
    formData.append("category",category)
    formData.append("description",description)
    if(image) formData.append("image",image)

    try{
      if(editingId){
        await api.put(`/api/medicines/${editingId}`, formData)
        toast("Medicine updated", "success")
      }else{
        await api.post("/api/medicines", formData)
        toast("Medicine added", "success")
      }
      resetForm()
      fetchMedicines()
    }catch(err){
      toast(err.response?.data?.message || "Could not save medicine", "error")
    }finally{
      setSaving(false)
    }
  }

  const deleteMedicine = async(id, medName)=>{
    const ok = await confirm({
      title:`Delete "${medName}"?`,
      message:"This medicine will be permanently removed from the catalogue.",
      confirmText:"Delete",
      danger:true
    })
    if(!ok) return
    try{
      await api.delete(`/api/medicines/${id}`)
      toast("Medicine deleted", "success")
      fetchMedicines()
    }catch{
      toast("Could not delete medicine", "error")
    }
  }

  const editMedicine = (med)=>{
    setEditingId(med._id)
    setName(med.name)
    setPrice(med.price)
    setCategory(med.category)
    setDescription(med.description)
    setPreview(imageUrl(med.image))
    window.scrollTo({ top:0, behavior:"smooth" })
  }

  const stat = (v)=> Number(v || 0).toLocaleString("en-IN")

  return(

    <main id="main" className="admin-page">

      <div className="admin-head">
        <div className="admin-head-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
          </svg>
        </div>
        <div>
          <h2>Admin Dashboard</h2>
          <p>Manage your store catalogue and view performance</p>
        </div>
      </div>

      {/* ----------- STATS CARDS ----------- */}

      <div className="stats-container">

        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-meta">
            <p className="stat-value">{stat(stats.totalOrders)}</p>
            <h3>Total Orders</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-meta">
            <p className="stat-value">₹{stat(stats.totalRevenue)}</p>
            <h3>Total Revenue</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-meta">
            <p className="stat-value">{stat(stats.totalUsers)}</p>
            <h3>Total Users</h3>
          </div>
        </div>

      </div>

      {/* ----------- MEDICINE FORM ----------- */}

      <section className="medicine-form-card">

        <div className="medicine-form-header">
          <div className="mform-header-icon">
            {editingId ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            )}
          </div>
          <div>
            <h3>{editingId ? "Edit Medicine" : "Add New Medicine"}</h3>
            <p>{editingId ? "Update the product details below." : "Add a product to your store catalogue."}</p>
          </div>
          {editingId && <span className="editing-badge">Editing</span>}
        </div>

        <form onSubmit={addMedicine} className="medicine-form">

          <div className="mform-grid">

            <div className="form-group mform-full">
              <label htmlFor="med-name">Medicine Name</label>
              <input id="med-name" className="input" type="text" placeholder="e.g. Paracetamol"
                value={name} onChange={(e)=>setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="med-price">Price (₹)</label>
              <input id="med-price" className="input" type="number" min="0" placeholder="e.g. 20"
                value={price} onChange={(e)=>setPrice(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="med-cat">Category</label>
              <select id="med-cat" className="input" value={category}
                onChange={(e)=>setCategory(e.target.value)} required>
                <option value="">Select Category</option>
                <option value="Fever">Fever</option>
                <option value="Pain">Pain</option>
                <option value="Cold">Cold</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Vitamins">Vitamins</option>
              </select>
            </div>

            <div className="form-group mform-full">
              <label htmlFor="med-desc">Description</label>
              <textarea id="med-desc" className="input" placeholder="Short description of the medicine"
                value={description} onChange={(e)=>setDescription(e.target.value)} required />
            </div>

            {/* IMAGE UPLOAD */}
            <div className="form-group mform-full">
              <label>Product Image {editingId && <span className="label-hint">(leave blank to keep current)</span>}</label>
              <label htmlFor="med-img" className="image-dropzone">
                {preview ? (
                  <img src={preview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="image-dropzone-empty">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Click to upload an image</span>
                    <small>JPG, PNG or WEBP · up to 2MB</small>
                  </div>
                )}
                <input id="med-img" type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            </div>

          </div>

          <div className="profile-actions mform-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Medicine" : "Add Medicine"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

        </form>

      </section>

      {/* ----------- MEDICINE TABLE ----------- */}

      <section className="medicine-list-card">

        <div className="medicine-form-header">
          <div className="mform-header-icon list-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <h3>Medicine Catalogue</h3>
            <p>{medicines.length} product{medicines.length !== 1 ? "s" : ""} in your store</p>
          </div>
        </div>

        {medicines.length === 0 ? (
          <p className="med-empty">No medicines yet — add your first product above.</p>
        ) : (

        <div className="table-scroll">
        <table className="medicine-table">

          <caption className="sr-only">List of medicines with actions to edit or delete</caption>

          <thead>
            <tr>
              <th scope="col">Image</th>
              <th scope="col">Name</th>
              <th scope="col">Price</th>
              <th scope="col">Category</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>

            {medicines.map(med=>(

              <tr key={med._id}>

                <td>
                  <div className="med-thumb">
                    <img src={imageUrl(med.image)} alt={med.name} onError={onImageError} />
                  </div>
                </td>

                <td className="med-name-cell">{med.name}</td>
                <td><b>₹{med.price}</b></td>
                <td><span className="med-cat-chip">{med.category}</span></td>

                <td>
                  <div className="med-actions">
                    <button className="med-edit" onClick={()=>editMedicine(med)} aria-label={`Edit ${med.name}`}>
                      Edit
                    </button>
                    <button className="med-delete" onClick={()=>deleteMedicine(med._id, med.name)} aria-label={`Delete ${med.name}`}>
                      Delete
                    </button>
                  </div>
                </td>

              </tr>

            ))}

          </tbody>

        </table>
        </div>

        )}

      </section>

    </main>

  )

}

export default Admin
