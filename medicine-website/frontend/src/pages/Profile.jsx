import { useState } from "react"
import api from "../api"
import { useAuth } from "../context/AuthContext"
import AddressBook from "../components/AddressBook"
import { isRequired, isValidPhone } from "../utils/validation"

function Profile(){

  const { name:authName, email, phone:authPhone, updateUser } = useAuth()

  const [name,setName] = useState(authName || "")
  const [phone,setPhone] = useState(authPhone || "")

  const [editMode,setEditMode] = useState(false)
  const [errors,setErrors] = useState({})
  const [saving,setSaving] = useState(false)

  const saveProfile = async()=>{

    const e = {}
    if(!isRequired(name)) e.name = "Name is required"
    if(!isValidPhone(phone)) e.phone = "Enter a valid 10-digit phone number"
    setErrors(e)
    if(Object.keys(e).length) return

    setSaving(true)
    try{

      const res = await api.put(
        "/api/auth/update-profile",
        { name, phone }
      )

      updateUser({
        name: res.data.user.name,
        phone: res.data.user.phone
      })

      setEditMode(false)
      setErrors({})

    }catch(err){
      setErrors({ form: err.response?.data?.message || "Update failed" })
    }finally{
      setSaving(false)
    }

  }

  const cancelEdit = ()=>{
    setName(authName || "")
    setPhone(authPhone || "")
    setErrors({})
    setEditMode(false)
  }

  return(

    <div className="profile-wrap">

      <form
        className="profile-card"
        onSubmit={(e)=>{ e.preventDefault(); if(editMode) saveProfile() }}
        noValidate
      >

        <div className="profile-header">
          <div className="profile-avatar">{(authName || "U").charAt(0).toUpperCase()}</div>
          <div className="profile-header-info">
            <h2>{authName || "My Profile"}</h2>
            <p className="muted">{email}</p>
          </div>
        </div>

        {errors.form && <div className="form-error-box">{errors.form}</div>}

        {/* NAME */}
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            value={name}
            disabled={!editMode}
            onChange={(e)=>setName(e.target.value)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        {/* EMAIL */}
        <div className="form-group">
          <label>Email</label>
          <input className="input" value={email} disabled />
        </div>

        {/* PHONE */}
        <div className="form-group">
          <label>Phone Number</label>
          <input
            className="input"
            value={phone}
            disabled={!editMode}
            onChange={(e)=>setPhone(e.target.value)}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        {/* BUTTONS */}
        {!editMode ? (
          <button type="button" className="btn" onClick={()=>setEditMode(true)}>
            Edit Profile
          </button>
        ) : (
          <div className="profile-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        )}

      </form>

      {/* ADDRESS MANAGEMENT */}
      <div className="profile-card">
        <AddressBook />
      </div>

    </div>

  )

}

export default Profile
