import { useEffect, useState, useCallback } from 'react'

export default function GameControls() {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState({
    steering: 0,
    throttle: 0,
    brake: 0
  })

  // WebSocket connection - adjust URL to your game server
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080') // Change this to your game's WebSocket URL
      
      ws.onopen = () => {
        console.log('Connected to game server')
        setConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received from game:', data)
        } catch (err) {
          console.log('Received raw message:', event.data)
        }
      }
      
      ws.onclose = () => {
        console.log('Disconnected from game server')
        setConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      setSocket(ws)
    }

    connectWebSocket()

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  const sendGameCommand = useCallback((action, value) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        action,
        value,
        timestamp: Date.now()
      }
      socket.send(JSON.stringify(message))
      console.log('Sent to game:', message)
    }
  }, [socket])

  const handleSteering = (direction) => {
    const value = direction === 'left' ? -1 : direction === 'right' ? 1 : 0
    setGameState(prev => ({ ...prev, steering: value }))
    sendGameCommand('steer', value)
  }

  const handleThrottle = (value) => {
    setGameState(prev => ({ ...prev, throttle: value }))
    sendGameCommand('throttle', value)
  }

  const handleBrake = (value) => {
    setGameState(prev => ({ ...prev, brake: value }))
    sendGameCommand('brake', value)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          handleSteering('left')
          break
        case 'd':
        case 'arrowright':
          handleSteering('right')
          break
        case 'w':
        case 'arrowup':
          handleThrottle(1)
          break
        case 's':
        case 'arrowdown':
          handleBrake(1)
          break
      }
    }

    const handleKeyUp = (e) => {
      switch(e.key.toLowerCase()) {
        case 'a':
        case 'd':
        case 'arrowleft':
        case 'arrowright':
          handleSteering('center')
          break
        case 'w':
        case 'arrowup':
          handleThrottle(0)
          break
        case 's':
        case 'arrowdown':
          handleBrake(0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '15px 25px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    backdropFilter: 'blur(10px)'
  }

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'rgba(0, 255, 0, 0.3)',
    borderColor: 'rgba(0, 255, 0, 0.5)',
    transform: 'scale(0.95)'
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      zIndex: 20
    }}>
      {/* Connection Status */}
      <div style={{
        background: connected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        minWidth: '200px'
      }}>
        {/* Steering */}
        <button 
          style={gameState.steering === -1 ? activeButtonStyle : buttonStyle}
          onMouseDown={() => handleSteering('left')}
          onMouseUp={() => handleSteering('center')}
          onTouchStart={() => handleSteering('left')}
          onTouchEnd={() => handleSteering('center')}
        >
          ←
        </button>
        
        <button 
          style={gameState.throttle > 0 ? activeButtonStyle : buttonStyle}
          onMouseDown={() => handleThrottle(1)}
          onMouseUp={() => handleThrottle(0)}
          onTouchStart={() => handleThrottle(1)}
          onTouchEnd={() => handleThrottle(0)}
        >
          ↑
        </button>
        
        <button 
          style={gameState.steering === 1 ? activeButtonStyle : buttonStyle}
          onMouseDown={() => handleSteering('right')}
          onMouseUp={() => handleSteering('center')}
          onTouchStart={() => handleSteering('right')}
          onTouchEnd={() => handleSteering('center')}
        >
          →
        </button>

        <div></div>
        
        <button 
          style={gameState.brake > 0 ? activeButtonStyle : buttonStyle}
          onMouseDown={() => handleBrake(1)}
          onMouseUp={() => handleBrake(0)}
          onTouchStart={() => handleBrake(1)}
          onTouchEnd={() => handleBrake(0)}
        >
          ↓
        </button>
        
        <div></div>
      </div>

      {/* Debug Info */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div>Steering: {gameState.steering}</div>
        <div>Throttle: {gameState.throttle}</div>
        <div>Brake: {gameState.brake}</div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        maxWidth: '200px'
      }}>
        <strong>Controls:</strong><br/>
        WASD or Arrow Keys<br/>
        Mouse/Touch buttons
      </div>
    </div>
  )
}