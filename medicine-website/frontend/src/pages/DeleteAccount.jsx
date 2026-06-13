import api from "../api"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useConfirm } from "../context/ConfirmContext"
import PasswordInput from "../components/PasswordInput"

function DeleteAccount(){

  const navigate = useNavigate()
  const { logout } = useAuth()
  const confirm = useConfirm()

  const [password,setPassword] = useState("")
  const [error,setError] = useState("")
  const [submitting,setSubmitting] = useState(false)

  const handleDelete = async()=>{

    setError("")

    if(!password){
      setError("Please enter your password to confirm")
      return
    }

    const confirmDelete = await confirm({
      title:"Delete your account?",
      message:"This permanently deletes your account and cannot be undone.",
      confirmText:"Delete account",
      cancelText:"Keep account",
      danger:true
    })

    if(!confirmDelete) return

    setSubmitting(true)

    try{

      await api.delete("/api/auth/delete-account", { data:{ password } })

      logout()
      navigate("/")

    }catch(err){

      setError(err.response?.data?.message || "Incorrect password or error")

    }finally{
      setSubmitting(false)
    }

  }

  return(

    <div className="auth-container">

      <form className="auth-box danger-card" onSubmit={(e)=>{ e.preventDefault(); handleDelete() }} noValidate>

        <div className="danger-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </div>

        <h2 style={{textAlign:"center", margin:"4px 0 2px"}}>Delete Account</h2>
        <p className="danger-sub">This action is permanent and cannot be undone.</p>

        <div className="danger-callout">
          <span>Deleting your account will remove:</span>
          <ul>
            <li>Your profile and saved addresses</li>
            <li>Your order history</li>
            <li>Access to this account</li>
          </ul>
        </div>

        {error && <div className="form-error-box">{error}</div>}

        <div className="form-group">
          <label>Confirm your password</label>
          <PasswordInput
            placeholder="Enter your password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-danger"
          disabled={submitting}
        >
          {submitting ? "Deleting..." : "Delete My Account"}
        </button>

        <Link to="/profile" className="link-text" style={{textAlign:"center", display:"block"}}>
          Cancel and go back
        </Link>

      </form>

    </div>

  )

}

export default DeleteAccount
