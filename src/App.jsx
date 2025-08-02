import GameControls from './GameControls'
import WebView from './WebView'
import { useState, useEffect, useRef } from 'react'

function App() {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [speedHistory, setSpeedHistory] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  // WebSocket connection for speed data
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      try {
        const ws = new WebSocket('ws://192.168.1.41:8765')
        wsRef.current = ws

        ws.onopen = () => {
          console.log('Connected to speed sensor WebSocket')
          setWsConnected(true)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.speed !== undefined) {
              setSpeed(data.speed)
              setSpeedHistory(prev => {
                const newHistory = [...prev.slice(-49), data.speed]
                return newHistory
              })
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          console.log('WebSocket connection closed')
          setWsConnected(false)
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...')
              connectWebSocket()
            }, 3000)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setWsConnected(false)
        }
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        setWsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2)
  }

  const formatSpeed = (speed) => {
    return speed.toFixed(1)
  }

  // Mock data for distance graph (keep as mock for now)
  const generateGraphData = (value, maxValue = 100) => {
    return Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: Math.min(value + Math.random() * 10, maxValue)
    }))
  }

  const distanceData = generateGraphData(distance, 50)
  
  // Real speed data from WebSocket
  const speedData = speedHistory.length > 0 
    ? speedHistory.map((speedValue, i) => ({
        x: i,
        y: speedValue
      }))
    : generateGraphData(speed, 30)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: 'white',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Metrics Bar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '15px 25px',
        borderRadius: '12px'
      }}>
        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            ELAPSED TIME
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* WebSocket Status */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            SPEED SENSOR
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: wsConnected ? '#22c55e' : '#ef4444',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {wsConnected ? '● CONNECTED' : '● DISCONNECTED'}
          </div>
        </div>

        {/* Start/Stop Button */}
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            background: isActive ? '#ff4444' : '#000',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}
        >
          {isActive ? 'STOP' : 'START'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginTop: '80px',
        padding: '20px',
        gap: '20px'
      }}>
        {/* Central Video - Larger */}
        <div style={{
          flex: 1,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '60vh'
        }}>
          <WebView url="https://mirage.decart.ai/gameplay" />
        </div>

        {/* Bottom Metrics Row */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          {/* Distance Graph */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            width: '300px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#000',
              marginBottom: '15px',
              textAlign: 'center',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              DISTANCE: {formatDistance(distance)} km
            </div>
            <div style={{
              height: '80px',
              position: 'relative'
            }}>
              {distanceData.map((point, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(point.x / 49) * 100}%`,
                    bottom: `${(point.y / 50) * 100}%`,
                    width: '2px',
                    height: '2px',
                    background: '#000',
                    borderRadius: '50%'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Speed Graph */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            width: '300px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#000',
              marginBottom: '15px',
              textAlign: 'center',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              SPEED: {formatSpeed(speed)} km/h
            </div>
            <div style={{
              height: '80px',
              position: 'relative',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>
              {speedData.map((point, i) => {
                const maxSpeed = Math.max(...speedData.map(p => p.y), 30)
                const normalizedY = (point.y / maxSpeed) * 100
                const xPos = speedData.length > 1 ? (i / (speedData.length - 1)) * 100 : 50
                
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${xPos}%`,
                      bottom: `${normalizedY}%`,
                      width: '3px',
                      height: '3px',
                      background: wsConnected ? '#22c55e' : '#000',
                      borderRadius: '50%',
                      transform: 'translate(-50%, 50%)'
                    }}
                  />
                )
              })}
              {speedData.length > 1 && (
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  <polyline
                    points={speedData.map((point, i) => {
                      const maxSpeed = Math.max(...speedData.map(p => p.y), 30)
                      const normalizedY = 80 - (point.y / maxSpeed) * 80
                      const xPos = speedData.length > 1 ? (i / (speedData.length - 1)) * 300 : 150
                      return `${xPos},${normalizedY}`
                    }).join(' ')}
                    fill="none"
                    stroke={wsConnected ? '#22c55e' : '#000'}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App