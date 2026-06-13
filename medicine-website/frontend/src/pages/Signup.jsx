import api from "../api"
import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { isValidEmail, isValidPhone, isValidPassword, isRequired } from "../utils/validation"
import PasswordInput from "../components/PasswordInput"

function Signup(){

  const navigate = useNavigate()

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [phone,setPhone] = useState("")

  const [emailOtp,setEmailOtp] = useState("")
  const [otpSent,setOtpSent] = useState(false)
  const [timer,setTimer] = useState(0)

  const [errors,setErrors] = useState({})
  const [busy,setBusy] = useState(false)

  /* RESEND TIMER */
  useEffect(()=>{
    let interval
    if(timer > 0){
      interval = setInterval(()=> setTimer(prev => prev - 1), 1000)
    }
    return ()=>clearInterval(interval)
  },[timer])

  const validateDetails = ()=>{
    const e = {}
    if(!isRequired(name)) e.name = "Name is required"
    if(!isValidEmail(email)) e.email = "Enter a valid email address"
    if(!isValidPhone(phone)) e.phone = "Enter a valid 10-digit phone number"
    if(!isValidPassword(password)) e.password = "Min 8 chars with upper, lower, number & special character"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const sendOtp = async()=>{
    if(!validateDetails()) return
    setBusy(true)
    try{
      await api.post("/api/auth/send-email-otp", { email })
      setOtpSent(true)
      setTimer(30)
    }catch{
      setErrors({ form:"Failed to send OTP. Try again." })
    }finally{
      setBusy(false)
    }
  }

  const verifyAndSignup = async()=>{
    if(!isRequired(emailOtp)){
      setErrors({ otp:"Enter the OTP sent to your email" })
      return
    }
    setBusy(true)
    try{
      // OTP is validated server-side as part of signup (single authoritative call)
      await api.post("/api/auth/signup", { name, email, password, phone, otp: emailOtp })
      navigate("/login")
    }catch(err){
      setErrors({ otp: err.response?.data?.message || "Invalid OTP" })
    }finally{
      setBusy(false)
    }
  }

  return(

    <div className="auth-container">

      <form
        className="auth-box"
        onSubmit={(e)=>{ e.preventDefault(); otpSent ? verifyAndSignup() : sendOtp() }}
        noValidate
      >

        <h2>Create your account</h2>

        {errors.form && <div className="form-error-box">{errors.form}</div>}

        <div className="form-group">
          <input className="input" placeholder="Name"
            value={name} onChange={(e)=>setName(e.target.value)} disabled={otpSent} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <input className="input" placeholder="Email"
            value={email} onChange={(e)=>setEmail(e.target.value)} disabled={otpSent} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {/* PASSWORD */}
        <div className="form-group">
          <PasswordInput
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            disabled={otpSent}
          />
          {errors.password
            ? <span className="field-error">{errors.password}</span>
            : <span className="field-hint">Use upper & lower case, a number and a special character.</span>}
        </div>

        <div className="form-group">
          <input className="input" placeholder="Phone Number"
            value={phone} onChange={(e)=>setPhone(e.target.value)} disabled={otpSent} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        {/* SEND OTP */}
        {!otpSent && (
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Sending..." : "Send OTP"}
          </button>
        )}

        {/* OTP SECTION */}
        {otpSent && (
          <>
            <div className="form-group">
              <input className="input" placeholder="Enter OTP"
                value={emailOtp} onChange={(e)=>setEmailOtp(e.target.value)} />
              {errors.otp && <span className="field-error">{errors.otp}</span>}
            </div>

            {timer > 0 ? (
              <span className="field-hint">Resend OTP in {timer}s</span>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={sendOtp} disabled={busy}>
                Resend OTP
              </button>
            )}

            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Verifying..." : "Verify & Sign Up"}
            </button>
          </>
        )}

        <p style={{textAlign:"center"}}>
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </form>

    </div>

  )

}

export default Signup
