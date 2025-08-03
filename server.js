const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process')

const app = express()
const port = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Store for current prompt - using file system for simplicity
const promptFilePath = path.join(__dirname, 'current-prompt.json')

// Endpoint to receive text prompts
app.post('/prompt', (req, res) => {
  const { text } = req.body
  
  if (!text) {
    return res.status(400).json({ error: 'Text field is required' })
  }
  
  console.log('Received prompt:', text)
  
  // Store the prompt for the Electron app to pick up
  const promptData = {
    text,
    timestamp: Date.now(),
    processed: false
  }
  
  try {
    fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2))
    console.log('✅ Prompt saved successfully')
    
    // Wait 2 seconds then execute the type_perod.sh script
    setTimeout(() => {
      const scriptPath = path.join(__dirname, 'type_perod.sh')
      console.log(`🔧 Executing bash script after 2 seconds: ${scriptPath}`)
      
      try {
        const output = execSync(`bash "${scriptPath}"`, { encoding: 'utf8', timeout: 5000 })
        console.log('✅ BASH SCRIPT EXECUTED SUCCESSFULLY!')
        console.log('Script output:', output)
      } catch (scriptError) {
        console.error('❌ BASH SCRIPT EXECUTION FAILED:', scriptError.message)
        console.error('Script stderr:', scriptError.stderr)
      }
    }, 2000)
    
    res.json({ 
      success: true, 
      message: 'Prompt received, saved, and bash script will execute after 2 seconds',
      prompt: text,
      bashScriptScheduled: true
    })
  } catch (error) {
    console.error('❌ Error in prompt endpoint:', error)
    res.status(500).json({ error: 'Failed to process prompt' })
  }
})

// Endpoint to serve current prompt as JSON
app.get('/current-prompt.json', (req, res) => {
  try {
    if (fs.existsSync(promptFilePath)) {
      const promptData = JSON.parse(fs.readFileSync(promptFilePath, 'utf8'))
      res.json(promptData)
    } else {
      res.status(404).json({ error: 'No prompt found' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Error reading prompt' })
  }
})

// Endpoint to mark prompt as processed
app.post('/api/mark-processed', (req, res) => {
  try {
    if (fs.existsSync(promptFilePath)) {
      fs.unlinkSync(promptFilePath)
      res.json({ success: true, message: 'Prompt marked as processed' })
    } else {
      res.status(404).json({ error: 'No prompt file found' })
    }
  } catch (error) {
    console.error('Error marking prompt as processed:', error)
    res.status(500).json({ error: 'Failed to mark prompt as processed' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Start server
app.listen(port, () => {
  console.log(`Prompt server running on http://localhost:${port}`)
  console.log('Send POST requests to http://localhost:3001/prompt with JSON body: {"text": "your prompt here"}')
})

module.exports = app