import { useEffect, useState, useCallback } from 'react'

export default function GameControls() {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  
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
        console.log('🏎️ Connected to Mario Kart server')
        setConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Received from Mario Kart:', data)
        } catch (err) {
          console.log('📨 Received raw message:', event.data)
        }
      }
      
      ws.onclose = () => {
        console.log('🔴 Disconnected from Mario Kart server')
        setConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
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

  // Simple, reliable input sending
  const sendInput = useCallback((inputData) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(inputData))
      console.log('🎮 Sent to Mario Kart:', inputData)
      return true
    } else {
      console.warn('⚠️ WebSocket not ready, input not sent:', inputData)
      return false
    }
  }, [socket])

  const updateInput = useCallback((updates) => {
    setCurrentInput(prev => {
      const newInput = { ...prev, ...updates }
      sendInput(newInput)
      return newInput
    })
  }, [sendInput])

  // Keyboard controls - matches working HTML example pattern
  useEffect(() => {
    const handleKeyDown = (e) => {
      let updates = {}
      let changed = false
      
      switch(e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          if (!currentInput.left) {
            updates.left = true
            changed = true
          }
          break
        case 'KeyD':
        case 'ArrowRight':
          if (!currentInput.right) {
            updates.right = true
            changed = true
          }
          break
        case 'KeyW':
        case 'ArrowUp':
          if (!currentInput.forward) {
            updates.forward = true
            changed = true
          }
          break
        case 'KeyS':
        case 'ArrowDown':
          if (!currentInput.backward) {
            updates.backward = true
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
      let updates = {}
      let changed = false
      
      switch(e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          updates.left = false
          changed = true
          break
        case 'KeyD': 
        case 'ArrowRight':
          updates.right = false
          changed = true
          break
        case 'KeyW':
        case 'ArrowUp':
          updates.forward = false
          changed = true
          break
        case 'KeyS':
        case 'ArrowDown':
          updates.backward = false
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
          style={currentInput.left ? activeButtonStyle : buttonStyle}
          onMouseDown={() => updateInput({ left: true })}
          onMouseUp={() => updateInput({ left: false })}
          onMouseLeave={() => updateInput({ left: false })}
          onTouchStart={(e) => { e.preventDefault(); updateInput({ left: true }) }}
          onTouchEnd={(e) => { e.preventDefault(); updateInput({ left: false }) }}
        >
          ←
        </button>
        
        <button 
          style={currentInput.forward ? activeButtonStyle : buttonStyle}
          onMouseDown={() => updateInput({ forward: true })}
          onMouseUp={() => updateInput({ forward: false })}
          onMouseLeave={() => updateInput({ forward: false })}
          onTouchStart={(e) => { e.preventDefault(); updateInput({ forward: true }) }}
          onTouchEnd={(e) => { e.preventDefault(); updateInput({ forward: false }) }}
        >
          ↑
        </button>
        
        <button 
          style={currentInput.right ? activeButtonStyle : buttonStyle}
          onMouseDown={() => updateInput({ right: true })}
          onMouseUp={() => updateInput({ right: false })}
          onMouseLeave={() => updateInput({ right: false })}
          onTouchStart={(e) => { e.preventDefault(); updateInput({ right: true }) }}
          onTouchEnd={(e) => { e.preventDefault(); updateInput({ right: false }) }}
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
          style={currentInput.backward ? activeButtonStyle : buttonStyle}
          onMouseDown={() => updateInput({ backward: true })}
          onMouseUp={() => updateInput({ backward: false })}
          onMouseLeave={() => updateInput({ backward: false })}
          onTouchStart={(e) => { e.preventDefault(); updateInput({ backward: true }) }}
          onTouchEnd={(e) => { e.preventDefault(); updateInput({ backward: false }) }}
        >
          ↓
        </button>
        
        <div></div>
      </div>

      {/* Debug Info - Simple and Clear */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div style={{color: currentInput.forward ? '#0f0' : '#666'}}>Forward: {currentInput.forward ? '✅' : '❌'}</div>
        <div style={{color: currentInput.backward ? '#0f0' : '#666'}}>Backward: {currentInput.backward ? '✅' : '❌'}</div>
        <div style={{color: currentInput.left ? '#0f0' : '#666'}}>Left: {currentInput.left ? '✅' : '❌'}</div>
        <div style={{color: currentInput.right ? '#0f0' : '#666'}}>Right: {currentInput.right ? '✅' : '❌'}</div>
        <div style={{color: currentInput.jump ? '#0f0' : '#666'}}>Jump: {currentInput.jump ? '✅' : '❌'}</div>
        <div style={{color: socket?.readyState === WebSocket.OPEN ? '#0f0' : '#f00'}}>
          Socket: {socket?.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'}
        </div>
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