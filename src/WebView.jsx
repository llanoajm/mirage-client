import { useEffect, useRef } from 'react'

export default function WebView({ url }) {
  const webviewRef = useRef(null)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDomReady = () => {
      console.log('WebView loaded:', url)
      
      // Inject CSS to hide only UI elements while preserving video content
      const css = `
        /* Hide the header with Mirage logo and controls */
        header#brand-neon-layout-header {
          display: none !important;
        }
        
        /* Hide mobile navigation at bottom */
        aside[hidden].fixed.bottom-0 {
          display: none !important;
        }
        
        /* Hide world selection sidebar */
        .absolute.bottom-8.z-49.left-0.right-4 {
          display: none !important;
        }
        
        /* Hide social media links */
        .absolute.bottom-6.z-20.right-6 {
          display: none !important;
        }
        
        /* Remove top padding from main content */
        main.flex-1.relative.h-dvh {
          padding-top: 0 !important;
        }
        
        /* Hide timer and controls in header area */
        .inline-flex.items-center.gap-2.py-2 {
          display: none !important;
        }
        
        /* Hide floating buttons */
        button[data-slot="tooltip-trigger"] {
          display: none !important;
        }
      `
      
      webview.insertCSS(css)
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