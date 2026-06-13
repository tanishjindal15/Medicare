import { Component } from "react"

/* Catches render errors anywhere below it so one broken component
   doesn't blank out the whole app. */
class ErrorBoundary extends Component {

  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info?.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.assign("/")
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="errorboundary">
          <div className="empty-emoji">😵</div>
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try again.</p>
          <button className="btn" onClick={this.handleReload}>Back to Home</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
