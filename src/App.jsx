import GameControls from './GameControls'
import WebView from './WebView'

function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Main Content */}
      <WebView url="https://mirage.decart.ai/gameplay" />
      
      {/* Game Controls Overlay */}
      <GameControls />
      
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 30px',
        borderRadius: '25px',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #00ff88, #00aaff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0
        }}>
          🎮 Mirage Game Client
        </h1>
      </div>
    </div>
  )
}

export default App