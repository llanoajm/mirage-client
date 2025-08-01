import { useState } from 'react'
import VideoStream from './VideoStream'
import GameControls from './GameControls'
import WebView from './WebView'

function App() {
  const [viewMode, setViewMode] = useState('camera') // 'camera' or 'iframe'

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Main Content */}
      {viewMode === 'camera' ? (
        <VideoStream />
      ) : (
        <WebView url="https://mirage.decart.ai/gameplay" />
      )}
      
      {/* Game Controls Overlay */}
      <GameControls />
      
      {/* Header with Mode Toggle */}
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
        alignItems: 'center',
        gap: '20px'
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
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode('camera')}
            style={{
              background: viewMode === 'camera' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            📹 Camera
          </button>
          <button
            onClick={() => setViewMode('iframe')}
            style={{
              background: viewMode === 'iframe' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🌐 Direct
          </button>
        </div>
      </div>
    </div>
  )
}

export default App