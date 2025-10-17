import { useState, useEffect } from 'react'
import './App.css'

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('sessionId', data.sessionId)
        localStorage.setItem('sessionExpires', data.expires)
        localStorage.setItem('isAdmin', JSON.stringify(data.isAdmin))
        onLogin(data.sessionId, data.isAdmin)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-title">
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
            <div className="workshop-feedback-text">Workshop Feedback</div>
          </div>
          <p>Please enter your password to access the feedback data</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
      </div>
    </div>
  )
}

export default Login
