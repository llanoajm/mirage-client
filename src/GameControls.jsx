import { useEffect, useState, useCallback } from 'react'

export default function GameControls() {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState({
    steering: 0,
    throttle: 0,
    brake: 0
  })
  
  // Mario Kart input state - matches working HTML example
  const [currentInput, setCurrentInput] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
  })

  // WebSocket connection to Mario Kart server
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8082') // Mario Kart WebSocket server
      
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

  // Send complete input state - matches working HTML example
  const sendInput = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(currentInput))
      console.log('Sent to Mario Kart:', currentInput)
    }
  }, [socket, currentInput])

  const updateInput = useCallback((updates) => {
    setCurrentInput(prev => {
      const newInput = { ...prev, ...updates }
      // Send immediately after state update
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(newInput))
        console.log('Sent to Mario Kart:', newInput)
      }
      return newInput
    })
  }, [socket])

  const handleSteering = (direction) => {
    const value = direction === 'left' ? -1 : direction === 'right' ? 1 : 0
    setGameState(prev => ({ ...prev, steering: value }))
    
    updateInput({
      left: direction === 'left',
      right: direction === 'right'
    })
  }

  const handleThrottle = (value) => {
    setGameState(prev => ({ ...prev, throttle: value }))
    updateInput({ forward: value > 0 })
  }

  const handleBrake = (value) => {
    setGameState(prev => ({ ...prev, brake: value }))
    updateInput({ backward: value > 0 })
  }

  // Keyboard controls - matches working HTML example pattern
  useEffect(() => {
    const handleKeyDown = (e) => {
      let changed = false
      const updates = {}
      
      switch(e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          if (!currentInput.left) {
            updates.left = true
            handleSteering('left')
            changed = true
          }
          break
        case 'KeyD':
        case 'ArrowRight':
          if (!currentInput.right) {
            updates.right = true
            handleSteering('right') 
            changed = true
          }
          break
        case 'KeyW':
        case 'ArrowUp':
          if (!currentInput.forward) {
            updates.forward = true
            handleThrottle(1)
            changed = true
          }
          break
        case 'KeyS':
        case 'ArrowDown':
          if (!currentInput.backward) {
            updates.backward = true
            handleBrake(1)
            changed = true
          }
          break
        case 'Space':
          if (!currentInput.jump) {
            updates.jump = true
            changed = true
          }
          break
      }
      
      if (changed) {
        e.preventDefault()
        updateInput(updates)
      }
    }

    const handleKeyUp = (e) => {
      let changed = false
      const updates = {}
      
      switch(e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          updates.left = false
          handleSteering('center')
          changed = true
          break
        case 'KeyD': 
        case 'ArrowRight':
          updates.right = false
          handleSteering('center')
          changed = true
          break
        case 'KeyW':
        case 'ArrowUp':
          updates.forward = false
          handleThrottle(0)
          changed = true
          break
        case 'KeyS':
        case 'ArrowDown':
          updates.backward = false
          handleBrake(0)
          changed = true
          break
        case 'Space':
          updates.jump = false
          changed = true
          break
      }
      
      if (changed) {
        updateInput(updates)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [currentInput, updateInput])

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
        {connected ? '🏎️ Mario Kart Connected' : '🔴 Mario Kart Disconnected'}
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

        <button 
          style={currentInput.jump ? activeButtonStyle : buttonStyle}
          onMouseDown={() => updateInput({ jump: true })}
          onMouseUp={() => updateInput({ jump: false })}
          onMouseLeave={() => updateInput({ jump: false })}
          onTouchStart={(e) => { e.preventDefault(); updateInput({ jump: true }) }}
          onTouchEnd={(e) => { e.preventDefault(); updateInput({ jump: false }) }}
        >
          🚀
        </button>
        
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
        <div>Forward: {currentInput.forward ? '✅' : '❌'}</div>
        <div>Backward: {currentInput.backward ? '✅' : '❌'}</div>
        <div>Left: {currentInput.left ? '✅' : '❌'}</div>
        <div>Right: {currentInput.right ? '✅' : '❌'}</div>
        <div>Jump: {currentInput.jump ? '✅' : '❌'}</div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        maxWidth: '200px'
      }}>
        <strong>Mario Kart Controls:</strong><br/>
        WASD or Arrow Keys<br/>
        Space = Jump/Drift<br/>
        Mouse/Touch buttons
      </div>
    </div>
  )
}