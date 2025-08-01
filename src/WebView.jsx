import { useEffect, useRef } from 'react'

export default function WebView({ url }) {
  const webviewRef = useRef(null)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDomReady = () => {
      console.log('WebView loaded:', url)
    }

    const handleLoadStart = () => {
      console.log('WebView loading:', url)
    }

    const handleLoadStop = () => {
      console.log('WebView load complete:', url)
    }

    const handleFailLoad = (e) => {
      console.error('WebView failed to load:', e.errorDescription)
    }

    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadStop)
    webview.addEventListener('did-fail-load', handleFailLoad)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
      webview.removeEventListener('did-fail-load', handleFailLoad)
    }
  }, [url])

  return (
    <webview
      ref={webviewRef}
      src={url}
      style={{
        width: '100%',
        height: '100%',
        border: 'none'
      }}
      allowpopups="true"
      webpreferences="allowRunningInsecureContent"
    />
  )
}