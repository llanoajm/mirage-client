import GameControls from './GameControls'
import WebView from './WebView'
import { useState, useEffect, useRef } from 'react'

function App() {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [speedHistory, setSpeedHistory] = useState([])
  const [distanceHistory, setDistanceHistory] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const [iframeState, setIframeState] = useState('unknown') // 'eta', 'your-turn', 'active', 'unknown'
  const [rideStarted, setRideStarted] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const lastSpeedUpdate = useRef(null)
  const lastDistanceUpdate = useRef(Date.now())
  const lastDistanceSample = useRef(Date.now())
  const webviewRef = useRef(null)

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
              const currentTime = Date.now()
              const currentSpeed = data.speed
              
              setSpeed(currentSpeed)
              setSpeedHistory(prev => {
                const newHistory = [...prev.slice(-49), currentSpeed]
                return newHistory
              })
              
              // Auto-start timer when speed > 0 and not already active
              if (currentSpeed > 0 && !isActive) {
                console.log('Movement detected! Auto-starting timer...')
                setIsActive(true)
                setElapsedTime(0)
                setDistance(0)
                setDistanceHistory([])
                lastDistanceUpdate.current = currentTime
                lastDistanceSample.current = currentTime
              }
              
              // Calculate distance if we have a previous speed reading and timer is active
              if (lastSpeedUpdate.current && isActive) {
                const timeDiffSeconds = (currentTime - lastDistanceUpdate.current) / 1000
                const avgSpeed = (lastSpeedUpdate.current + currentSpeed) / 2
                const distanceIncrement = (avgSpeed * timeDiffSeconds) / 3600 // km/h * h = km
                
                setDistance(prev => {
                  const newDistance = prev + distanceIncrement
                  
                  // Sample distance for graph every 30 seconds
                  if (currentTime - lastDistanceSample.current >= 30000) {
                    setDistanceHistory(prevHistory => {
                      const newHistory = [...prevHistory, newDistance]
                      return newHistory.slice(-20) // Keep last 20 samples (10 minutes of data)
                    })
                    lastDistanceSample.current = currentTime
                  }
                  
                  return newDistance
                })
                
                lastDistanceUpdate.current = currentTime
              }
              
              lastSpeedUpdate.current = currentSpeed
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

  // Note: Prompt automation is now handled by preload.js script

  // Monitor iframe state continuously
  useEffect(() => {
    const detectIframeState = async () => {
      if (!webviewRef.current) return

      try {
        const stateScript = `
          function detectCurrentState() {
            // Check for ETA state - look for countdown timer and "In queue" text
            const etaElements = document.querySelectorAll('[class*="text-8xl"], [class*="text-[140px]"]');
            const inQueueText = document.querySelector('*:contains("In queue"), *:contains("ETA")');
            
            // Check for "Your turn" state
            const yourTurnText = document.querySelector('*:contains("It\\'s your turn!")');
            
            // Check for active game state - look for game interface elements
            const gameElements = document.querySelectorAll('[class*="fixed"], [class*="bottom-"]');
            const hasControls = document.querySelector('[role="button"], button, input, textarea, [contenteditable]');
            const hasTimeLeft = document.querySelector('*:contains("Time left")');
            
            // Advanced content detection
            const bodyText = document.body.textContent || '';
            
            if (bodyText.includes('ETA') && bodyText.includes('In queue')) {
              return 'eta';
            }
            
            if (bodyText.includes("It's your turn!") || yourTurnText) {
              return 'your-turn';
            }
            
            // Active state indicators - look for game controls and time left
            if (hasTimeLeft || (hasControls && !bodyText.includes('ETA') && !bodyText.includes("It's your turn!"))) {
              return 'active';
            }
            
            return 'unknown';
          }
          
          return detectCurrentState();
        `
        
        const detectedState = await webviewRef.current.executeJavaScript(stateScript)
        
        if (detectedState && detectedState !== iframeState) {
          console.log('🎮 Iframe state changed:', iframeState, '->', detectedState)
          setIframeState(detectedState)
          
          // Set ride started when we reach active state
          if (detectedState === 'active' && !rideStarted) {
            console.log('🚀 Ride started! Activating automation...')
            setRideStarted(true)
          }
          
          // Reset ride started if we go back to waiting states
          if ((detectedState === 'eta' || detectedState === 'your-turn') && rideStarted) {
            console.log('⏸️ Ride ended, returning to waiting state')
            setRideStarted(false)
          }
        }
      } catch (error) {
        // Silently ignore errors - iframe might not be ready
      }
    }

    const interval = setInterval(detectIframeState, 2000) // Check every 2 seconds
    return () => clearInterval(interval)
  }, [iframeState, rideStarted])


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

  // Mock data for distance graph (fallback)
  const generateGraphData = (value, maxValue = 100) => {
    return Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: Math.min(value + Math.random() * 10, maxValue)
    }))
  }

  // Real distance data from calculations - show cumulative distance over time
  const distanceData = distanceHistory.length > 0 
    ? distanceHistory.map((distValue, i) => ({
        x: i,
        y: distValue
      }))
    : (distance > 0 ? [{ x: 0, y: distance }] : [])
  
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
            color: 'black',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {wsConnected ? '● CONNECTED' : '● DISCONNECTED'}
          </div>
        </div>

        {/* Ride Status Indicator */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            RIDE STATUS
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: iframeState === 'active' ? '#22c55e' : '#666',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {iframeState === 'active' ? '● ACTIVE' : 
             iframeState === 'your-turn' ? '⏳ YOUR TURN' : 
             iframeState === 'eta' ? '⏱️ WAITING' : 
             '❓ UNKNOWN'}
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
          <WebView url="https://mirage.decart.ai/gameplay" ref={webviewRef} />
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
              position: 'relative',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>
              {distanceData.length > 0 && (
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
                  {/* Grid lines for reference */}
                  <defs>
                    <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Distance line - always ascending */}
                  {distanceData.length > 1 ? (
                    <polyline
                      points={distanceData.map((point, i) => {
                        const maxDistance = Math.max(...distanceData.map(p => p.y), 1)
                        const yPos = 80 - (point.y / maxDistance) * 70 // Leave 10px margin at top
                        const xPos = (i / (distanceData.length - 1)) * 300
                        return `${xPos},${yPos}`
                      }).join(' ')}
                      fill="none"
                      stroke={isActive ? '#3b82f6' : '#6b7280'}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ) : (
                    /* Single point - show as a dot */
                    distanceData.map((point, i) => {
                      const maxDistance = Math.max(point.y, 1)
                      const yPos = 80 - (point.y / maxDistance) * 70
                      return (
                        <circle
                          key={i}
                          cx="150"
                          cy={yPos}
                          r="4"
                          fill={isActive ? '#3b82f6' : '#6b7280'}
                        />
                      )
                    })
                  )}
                  
                  {/* Data points */}
                  {distanceData.map((point, i) => {
                    const maxDistance = Math.max(...distanceData.map(p => p.y), 1)
                    const yPos = 80 - (point.y / maxDistance) * 70
                    const xPos = distanceData.length > 1 ? (i / (distanceData.length - 1)) * 300 : 150
                    return (
                      <circle
                        key={i}
                        cx={xPos}
                        cy={yPos}
                        r="3"
                        fill={isActive ? '#3b82f6' : '#6b7280'}
                        stroke="white"
                        strokeWidth="1"
                      />
                    )
                  })}
                </svg>
              )}
              
              {/* No data state */}
              {distanceData.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#9ca3af',
                  fontSize: '12px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Start moving to track distance
                </div>
              )}
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