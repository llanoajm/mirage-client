import { useEffect, useRef, forwardRef } from 'react'

const WebView = forwardRef(function WebView({ url }, ref) {
  const webviewRef = useRef(null)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return
    
    // Expose webview to parent component via ref
    if (ref) {
      ref.current = webview
    }

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
        
        /* Loading Screen Styling - Black and White Theme */
        
        /* Set white background for loading screens */
        body {
          background: white !important;
        }
        
        /* Style the main loading container */
        main.pt-20 {
          background: white !important;
        }
        
        /* Hide the background video on loading screens */
        .absolute.inset-0.overflow-hidden.select-none {
          display: none !important;
        }
        
        /* Hide the Mirage logo on loading screens */
        img[alt="Mirage Logo"] {
          display: none !important;
        }
        
        /* Style the loading text containers */
        .text-white {
          color: black !important;
        }
        
        /* Style the ETA text - will be replaced with PIKE PIKER */
        .text-3xl.md\\:text-4xl {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-weight: 400 !important;
        }
        
        /* Style the countdown timer */
        .text-8xl.md\\:text-\\[140px\\].font-medium {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-weight: 500 !important;
        }
        
        /* Style the queue status text */
        .text-sm.md\\:text-xl {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        /* Style the queue badge */
        .inline-flex.items-center.justify-center.py-0\\.5.font-medium.w-fit.whitespace-nowrap.shrink-0 {
          background: black !important;
          color: white !important;
          border: 1px solid black !important;
        }
        
        /* Replace "It's your turn!" with "Pike Piker Experience" */
        .text-white.text-center.text-\\[33px\\].md\\:text-6xl.font-medium {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-weight: 500 !important;
        }
        
        /* Style the "The experience will start soon..." text */
        .text-white.text-xl.font-medium {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-weight: 500 !important;
        }
        
        /* Style the loading spinner - make it black */
        svg.animate-spin path {
          stroke: black !important;
        }
        
        /* Style the loading spinner gradient to be black */
        svg.animate-spin defs linearGradient stop {
          stop-color: black !important;
        }
        
        /* Style the "Session expired" text */
        .text-white.place-content-center.place-items-center.text-center.leading-tight.flex-col.gap-2.hidden .text-3xl {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .text-white.place-content-center.place-items-center.text-center.leading-tight.flex-col.gap-2.hidden .text-md {
          color: black !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        /* Keep the Start Experience button in its original color */
        .StartGameButton_button__NLn8b {
          /* Preserve original button styling */
        }
        
        /* Style the footer container */
        footer.z-10.flex.fixed.bottom-0.left-0.right-0.items-end.justify-center.pb-16.px-10 {
          background: transparent !important;
        }
        
        /* Style the footer text container */
        .font-medium.text-center {
          background: transparent !important;
        }
        
        /* Add elegant typography for loading text */
        .min-h-\\[calc\\(100dvh-14rem\\)\\].relative.flex.flex-col.place-content-center.place-items-center {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        /* Hide any centered images or assets when experience is ready */
        .min-h-\\[calc\\(100dvh-14rem\\)\\].relative.flex.flex-col.place-content-center.place-items-center img,
        .min-h-\\[calc\\(100dvh-14rem\\)\\].relative.flex.flex-col.place-content-center.place-items-center svg:not(.animate-spin) {
          display: none !important;
        }
        
        /* Hide the custom loading message since we're replacing text directly */
        .min-h-\\[calc\\(100dvh-14rem\\)\\].relative.flex.flex-col.place-content-center.place-items-center::before {
          display: none !important;
        }
        
        /* Show the original loading content since we're replacing text directly */
        .min-h-\\[calc\\(100dvh-14rem\\)\\].relative.flex.flex-col.place-content-center.place-items-center > div {
          opacity: 1 !important;
        }
      `
      
      webview.insertCSS(css)
      
      // Just inject CSS to modify text fields directly
      webview.executeJavaScript(`
        // Hide cookie banners
        const style = document.createElement('style');
        style.textContent = \`
          [class*="cookie" i], [id*="cookie" i], .cookieyes-banner, #cookieConsentModal { 
            display: none !important; 
          }
        \`;
        document.head.appendChild(style);
        
        // Check for prompts and modify HTML directly
        async function updateTextFields() {
          try {
            const response = await fetch('http://localhost:3001/current-prompt.json');
            const data = await response.json();
            if (!data.processed && data.text) {
              
              // Find all text inputs and modify their HTML directly
              const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea, [contenteditable]');
              inputs.forEach(input => {
                if (input.contentEditable === 'true') {
                  input.innerHTML = data.text;
                  input.textContent = data.text;
                } else {
                  input.value = data.text;
                  input.setAttribute('value', data.text);
                }
              });
              
              // Mark as processed
              fetch('http://localhost:3001/api/mark-processed', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({timestamp: data.timestamp})
              });
            }
          } catch(e) {}
        }
        
        setInterval(updateTextFields, 1000);
      `);
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
    webview.addEventListener('did-fail-load', handleDomReady) // Also inject CSS on fail load

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
      webview.removeEventListener('did-fail-load', handleDomReady)
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
})

export default WebView