import './App.css'

function App() {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'Roboto, sans-serif'
    }}>
      <h1 style={{
        fontSize: '25px',
        fontWeight: '700',
        color: '#333333',
        marginBottom: '15px',
        margin: '0 0 15px 0'
      }}>
        AI Web Workshop
      </h1>
      <p style={{
        fontSize: '8.33px',
        fontWeight: '700',
        color: '#f05f40ff',
        margin: '0'
      }}>
        STAGE ONE EDUCATION
      </p>
    </div>
  )
}

export default App
