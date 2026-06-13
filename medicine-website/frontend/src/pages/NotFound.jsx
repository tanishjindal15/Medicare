import { Link } from "react-router-dom"

function NotFound(){

  return(

    <div className="notfound">

      <div className="notfound-code">404</div>

      <h2 className="notfound-title">Page not found</h2>

      <p className="notfound-text">
        The page you’re looking for doesn’t exist or may have moved.
      </p>

      <Link to="/" className="btn notfound-btn">
        ← Back to Home
      </Link>

    </div>

  )

}

export default NotFound
