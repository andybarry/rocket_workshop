import { useState, useEffect } from 'react'
import './App.css'

function Login({ onLogin, onSetPassword, hasPassword }) {
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSettingPassword, setIsSettingPassword] = useState(!hasPassword)

  // Update isSettingPassword when hasPassword prop changes
  useEffect(() => {
    setIsSettingPassword(!hasPassword)
  }, [hasPassword])

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
        onLogin(data.sessionId)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSettingPassword(false)
        setNewPassword('')
        setConfirmPassword('')
        setError('')
        onSetPassword() // Notify parent that password was set
      } else {
        setError(data.error || 'Failed to set password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSettingPassword) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Set Password</h2>
            <p>Please set a password to secure the feedback system</p>
          </div>
          
          <form onSubmit={handleSetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm new password"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Workshop Feedback System</h2>
          <p>Please enter your password to access the feedback data</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Password:</label>
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
        
        <div className="login-footer">
          <button 
            type="button"
            className="change-password-btn"
            onClick={() => setIsSettingPassword(true)}
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
