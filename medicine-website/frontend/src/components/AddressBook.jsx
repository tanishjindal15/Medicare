import { useEffect, useState } from "react"
import api from "../api"
import { validateAddress } from "../utils/validation"
import { useConfirm } from "../context/ConfirmContext"

const EMPTY = { name:"", phone:"", street:"", city:"", state:"", pincode:"" }

/*
  Reusable address manager.
  Props:
    - onUse(address)  optional: shows a "Deliver here" button per address
    - selectedId      optional: highlights the chosen address
*/
function AddressBook({ onUse, selectedId }) {

  const [addresses,setAddresses] = useState([])
  const [form,setForm] = useState(EMPTY)
  const [editingId,setEditingId] = useState(null)
  const [showForm,setShowForm] = useState(false)
  const [errors,setErrors] = useState({})
  const [saving,setSaving] = useState(false)
  const confirm = useConfirm()

  const fetchAddresses = async()=>{
    try{
      const res = await api.get("/api/address")
      setAddresses(res.data)
    }catch(err){
      console.log(err)
    }
  }

  useEffect(()=>{ fetchAddresses() },[])

  const setField = (k,v)=> setForm(prev=>({ ...prev, [k]:v }))

  const openAdd = ()=>{
    setForm(EMPTY)
    setEditingId(null)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (addr)=>{
    setForm({
      name:addr.name, phone:addr.phone, street:addr.street,
      city:addr.city, state:addr.state, pincode:addr.pincode
    })
    setEditingId(addr._id)
    setErrors({})
    setShowForm(true)
  }

  const cancel = ()=>{
    setShowForm(false)
    setEditingId(null)
    setErrors({})
  }

  const save = async(e)=>{
    e.preventDefault()

    const errs = validateAddress(form)
    setErrors(errs)
    if(Object.keys(errs).length) return

    setSaving(true)
    try{
      if(editingId){
        await api.put(`/api/address/${editingId}`, form)
      }else{
        await api.post("/api/address", form)
      }
      await fetchAddresses()
      cancel()
    }catch(err){
      setErrors({ form: err.response?.data?.message || "Could not save address" })
    }finally{
      setSaving(false)
    }
  }

  const remove = async(id)=>{
    const ok = await confirm({
      title:"Delete this address?",
      message:"This saved address will be removed from your account.",
      confirmText:"Delete",
      danger:true
    })
    if(!ok) return
    try{
      await api.delete(`/api/address/${id}`)
      fetchAddresses()
    }catch(err){
      console.log(err)
    }
  }

  return(

    <div className="address-book">

      <div className="address-book-head">
        <h3>Saved Addresses</h3>
        {!showForm && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={openAdd}>
            + Add Address
          </button>
        )}
      </div>

      {addresses.length === 0 && !showForm && (
        <p style={{color:"var(--muted)"}}>No saved addresses yet.</p>
      )}

      {/* LIST */}
      {addresses.map(addr=>(
        <div
          key={addr._id}
          className={`address-card ${selectedId === addr._id ? "selected" : ""}`}
        >
          <p><b>{addr.name}</b> · {addr.phone}</p>
          <p>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>

          <div className="address-actions">
            {onUse && (
              selectedId === addr._id ? (
                <span className="address-selected-badge">✓ Delivering here</span>
              ) : (
                <button type="button" className="btn btn-sm" onClick={()=>onUse(addr)}>
                  Deliver here
                </button>
              )
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>openEdit(addr)}>
              Edit
            </button>
            <button type="button" className="remove-btn btn-sm" onClick={()=>remove(addr._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* ADD / EDIT FORM */}
      {showForm && (
        <form className="address-form" onSubmit={save} noValidate>

          <h4>{editingId ? "Edit Address" : "Add New Address"}</h4>

          {errors.form && <div className="form-error-box">{errors.form}</div>}

          <div className="form-row">
            <div className="form-group">
              <input className="input" placeholder="Full Name"
                value={form.name} onChange={(e)=>setField("name", e.target.value)} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <input className="input" placeholder="Phone"
                value={form.phone} onChange={(e)=>setField("phone", e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <input className="input" placeholder="Street Address"
              value={form.street} onChange={(e)=>setField("street", e.target.value)} />
            {errors.street && <span className="field-error">{errors.street}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <input className="input" placeholder="City"
                value={form.city} onChange={(e)=>setField("city", e.target.value)} />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
            <div className="form-group">
              <input className="input" placeholder="State"
                value={form.state} onChange={(e)=>setField("state", e.target.value)} />
              {errors.state && <span className="field-error">{errors.state}</span>}
            </div>
            <div className="form-group">
              <input className="input" placeholder="Pincode"
                value={form.pincode} onChange={(e)=>setField("pincode", e.target.value)} />
              {errors.pincode && <span className="field-error">{errors.pincode}</span>}
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save Address"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancel}>
              Cancel
            </button>
          </div>

        </form>
      )}

    </div>

  )
}

export default AddressBook
