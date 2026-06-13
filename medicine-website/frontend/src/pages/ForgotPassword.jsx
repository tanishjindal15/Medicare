import api from "../api"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { isValidEmail, isValidPassword, isRequired } from "../utils/validation"
import PasswordInput from "../components/PasswordInput"

function ForgotPassword(){

  const navigate = useNavigate()

  const [email,setEmail] = useState("")
  const [otp,setOtp] = useState("")
  const [newPassword,setNewPassword] = useState("")
  const [confirmPassword,setConfirmPassword] = useState("")
  const [otpSent,setOtpSent] = useState(false)

  const [errors,setErrors] = useState({})
  const [busy,setBusy] = useState(false)

  const sendOtp = async()=>{
    if(!isValidEmail(email)){
      setErrors({ email:"Enter a valid email address" })
      return
    }
    setBusy(true)
    try{
      await api.post("/api/auth/forgot-password", { email })
      setOtpSent(true)
      setErrors({})
    }catch(err){
      setErrors({ email: err.response?.data?.message || "User not found" })
    }finally{
      setBusy(false)
    }
  }

  const resetPassword = async()=>{
    const e = {}
    if(!isRequired(otp)) e.otp = "Enter the OTP"
    if(!isValidPassword(newPassword)) e.newPassword = "Min 8 chars with upper, lower, number & special character"
    if(newPassword !== confirmPassword) e.confirmPassword = "Passwords do not match"
    setErrors(e)
    if(Object.keys(e).length) return

    setBusy(true)
    try{
      await api.post("/api/auth/reset-password", { email, otp, newPassword })
      navigate("/login")
    }catch(err){
      setErrors({ otp: err.response?.data?.message || "Invalid OTP or error" })
    }finally{
      setBusy(false)
    }
  }

  return(

    <div className="auth-container">

      <form
        className="auth-box"
        onSubmit={(e)=>{ e.preventDefault(); otpSent ? resetPassword() : sendOtp() }}
        noValidate
      >

        <h2>Reset Password</h2>

        {/* EMAIL */}
        <div className="form-group">
          <input className="input" placeholder="Email"
            value={email} onChange={(e)=>setEmail(e.target.value)} disabled={otpSent} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {!otpSent && (
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Sending..." : "Send OTP"}
          </button>
        )}

        {otpSent && (
          <>
            <div className="form-group">
              <input className="input" placeholder="Enter OTP"
                value={otp} onChange={(e)=>setOtp(e.target.value)} />
              {errors.otp && <span className="field-error">{errors.otp}</span>}
            </div>

            {/* NEW PASSWORD */}
            <div className="form-group">
              <PasswordInput
                placeholder="New Password"
                value={newPassword}
                onChange={(e)=>setNewPassword(e.target.value)}
              />
              {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-group">
              <PasswordInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Updating..." : "Reset Password"}
            </button>
          </>
        )}

        <p style={{textAlign:"center"}}>
          <Link to="/login">Back to Login</Link>
        </p>

      </form>

    </div>

  )

}

export default ForgotPassword
