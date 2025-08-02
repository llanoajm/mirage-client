// Preload script for webview - runs as part of the page context
console.log('Preload script loaded');

let currentPrompt = null;
let isProcessing = false;

// Immediately hide cookie banners with CSS
const cookieStyle = document.createElement('style');
cookieStyle.textContent = `
  [class*="cookie" i]:not(input):not(textarea),
  [id*="cookie" i]:not(input):not(textarea),
  [data-testid*="cookie" i],
  [aria-label*="cookie" i],
  .cookieyes-banner,
  #cookieConsentModal,
  [class*="consent"],
  [id*="consent"],
  [class*="banner"]:not(.video-banner):not(.hero-banner) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    z-index: -9999 !important;
    position: absolute !important;
    left: -99999px !important;
  }
`;
document.head.appendChild(cookieStyle);

// Auto-dismiss cookie banners
function dismissCookieBanners() {
  const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], a');
  for (const btn of buttons) {
    const text = (btn.textContent || btn.innerText || btn.value || '').toLowerCase().trim();
    if (text === 'accept all' || 
        text === 'accept' || 
        text === 'ok' ||
        text === 'got it' ||
        text === 'continue' ||
        text.includes('accept all') ||
        text.includes('save my preferences')) {
      console.log('Auto-dismissing cookie banner:', text);
      btn.click();
      break;
    }
  }
}

// Run cookie dismissal immediately and periodically
dismissCookieBanners();
setInterval(dismissCookieBanners, 1000);

// Function to check for pending prompts
async function checkForPrompts() {
  if (isProcessing) return;
  
  try {
    const response = await fetch('http://localhost:3001/current-prompt.json');
    if (response.ok) {
      const promptData = await response.json();
      
      if (!promptData.processed && promptData.text && promptData.text !== currentPrompt) {
        console.log('New prompt detected in preload:', promptData.text);
        currentPrompt = promptData.text;
        processPrompt(promptData);
      }
    }
  } catch (error) {
    // Ignore errors - server might not be running
  }
}

// Function to process the prompt
async function processPrompt(promptData) {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    console.log('Processing prompt:', promptData.text);
    
    // Find any text input - be very aggressive
    const selectors = [
      'input[type="text"]',
      'input[type="search"]', 
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable]',
      '[role="textbox"]'
    ];
    
    let targetInput = null;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && !element.disabled && !element.readOnly) {
          targetInput = element;
          break;
        }
      }
      if (targetInput) break;
    }
    
    if (targetInput) {
      console.log('Found input element:', targetInput);
      
      // Method 1: Direct value assignment
      targetInput.focus();
      targetInput.click();
      
      if (targetInput.contentEditable === 'true') {
        targetInput.textContent = promptData.text;
        targetInput.innerHTML = promptData.text;
      } else {
        targetInput.value = promptData.text;
      }
      
      // Fire events
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Method 2: Clipboard fallback
      try {
        await navigator.clipboard.writeText(promptData.text);
        
        // Clear field first
        targetInput.select();
        document.execCommand('delete');
        
        // Paste from clipboard
        document.execCommand('paste');
        
        // Also try programmatic paste event
        targetInput.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData: new DataTransfer()
        }));
      } catch (clipboardError) {
        console.log('Clipboard method failed:', clipboardError);
      }
      
      // Submit - try multiple methods
      setTimeout(() => {
        // Method 1: Enter key
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter', 
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        targetInput.dispatchEvent(enterEvent);
        
        // Method 2: Find and click submit button
        const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"]');
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            btn.click();
            break;
          }
        }
        
        // Method 3: Submit form if exists
        const form = targetInput.closest('form');
        if (form) {
          form.submit();
        }
      }, 100);
      
      // Mark as processed
      setTimeout(async () => {
        try {
          await fetch('http://localhost:3001/api/mark-processed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: promptData.timestamp })
          });
        } catch (e) {
          console.log('Failed to mark as processed:', e);
        }
      }, 500);
      
      console.log('Prompt automation completed');
    } else {
      console.log('No text input found');
    }
    
  } catch (error) {
    console.error('Error processing prompt:', error);
  } finally {
    isProcessing = false;
  }
}

// Start checking for prompts immediately and every second
checkForPrompts();
setInterval(checkForPrompts, 1000);

// Also listen for page changes
document.addEventListener('DOMContentLoaded', checkForPrompts);
window.addEventListener('load', checkForPrompts);

console.log('Prompt automation preload script ready');