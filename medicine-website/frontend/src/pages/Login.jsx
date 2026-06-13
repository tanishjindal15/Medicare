import api from "../api"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { isValidEmail } from "../utils/validation"
import PasswordInput from "../components/PasswordInput"

function Login(){

  const navigate = useNavigate()
  const { login } = useAuth()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [errors,setErrors] = useState({})
  const [submitting,setSubmitting] = useState(false)

  const validate = ()=>{
    const e = {}
    if(!isValidEmail(email)) e.email = "Enter a valid email address"
    if(!password) e.password = "Password is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async(e)=>{

    e.preventDefault()

    if(!validate()) return

    setSubmitting(true)

    try{

      const res = await api.post(
        "/api/auth/login",
        { email,password }
      )

      login(res.data)

      navigate("/")

    }catch(err){

      setErrors({ form: err.response?.data?.message || "Invalid email or password" })

    }finally{
      setSubmitting(false)
    }

  }

  return(

    <div className="auth-container">

      <form className="auth-box" onSubmit={handleLogin} noValidate>

        <h2>Welcome back</h2>

        {errors.form && <div className="form-error-box">{errors.form}</div>}

        {/* EMAIL */}
        <div className="form-group">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {/* PASSWORD WITH SHOW/HIDE */}
        <div className="form-group">
          <PasswordInput
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {/* FORGOT PASSWORD */}
        <p
          onClick={()=>navigate("/forgot-password")}
          className="link-text"
        >
          Forgot Password?
        </p>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>

        <p style={{textAlign:"center"}}>
          New here? <Link to="/signup">Create an account</Link>
        </p>

      </form>

    </div>

  )

}

export default Login