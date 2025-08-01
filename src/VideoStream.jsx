import { useEffect, useRef, useState } from 'react'

export default function VideoStream() {
  const videoRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [availableCameras, setAvailableCameras] = useState([])

  useEffect(() => {
    initializeStream()
    
    // Prevent tab suspension
    const keepAlive = () => {
      // Send a tiny WebRTC keepalive every 5 seconds
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getVideoTracks()
        tracks.forEach(track => {
          // Just check track state to keep it active
          console.log('Keepalive - track active:', track.readyState === 'live')
        })
      }
    }
    
    const keepAliveInterval = setInterval(keepAlive, 5000)
    
    // Start Web Worker for aggressive keep-alive
    const worker = new Worker('/keepalive-worker.js')
    worker.postMessage('start')
    worker.onmessage = (e) => {
      if (e.data === 'heartbeat') {
        // Worker heartbeat received - tab is still alive
      }
    }
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - attempting to maintain stream')
        // Force video element to stay active
        if (videoRef.current) {
          videoRef.current.play().catch(e => console.log('Play failed:', e))
        }
      } else {
        console.log('Tab visible - stream should be active')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(keepAliveInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      worker.postMessage('stop')
      worker.terminate()
    }
  }, [])

  const initializeStream = async () => {
    try {
      // Get all available video devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      
      // Debug: Log all available cameras
      console.log('All available cameras:')
      videoDevices.forEach((device, index) => {
        console.log(`${index}: ${device.label} (${device.deviceId.slice(0, 10)}...)`)
      })
      
      // Try to find OBS Virtual Camera first
      let selectedDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes('obs') ||
        device.label.toLowerCase().includes('mirage') ||
        device.label.toLowerCase().includes('virtual')
      )
      
      // If no OBS camera found, use first available
      if (!selectedDevice && videoDevices.length > 0) {
        selectedDevice = videoDevices[0]
        console.log('No virtual camera found, using:', selectedDevice.label)
      } else if (selectedDevice) {
        console.log('Found virtual camera:', selectedDevice.label)
      }

      if (selectedDevice) {
        await startStream(selectedDevice.deviceId)
      } else {
        setError('No cameras found')
      }
    } catch (err) {
      setError(`Failed to initialize: ${err.message}`)
    }
  }

  const startStream = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false // Disable audio for now to focus on video permissions
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setError(null)
      }
    } catch (err) {
      setError(`Stream failed: ${err.message}`)
      setIsStreaming(false)
    }
  }

  const switchCamera = async (deviceId) => {
    if (videoRef.current && videoRef.current.srcObject) {
      // Stop current stream
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
    await startStream(deviceId)
  }


  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 10
        }}>
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '8px'
        }}
      />

      {/* Camera Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: 10
      }}>
        {/* Refresh Cameras Button */}
        <button
          onClick={initializeStream}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }}
          title="Refresh cameras"
        >
          🔄
        </button>

        {/* Camera Selector */}
        {availableCameras.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '10px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <select 
              onChange={(e) => switchCamera(e.target.value)}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                minWidth: '150px'
              }}
            >
              {availableCameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stream Status */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: isStreaming ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)',
        padding: '5px 15px',
        borderRadius: '20px',
        fontSize: '14px',
        zIndex: 10
      }}>
        {isStreaming ? '🔴 LIVE' : '⏸️ NO SIGNAL'}
      </div>
    </div>
  )
}