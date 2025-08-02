#!/usr/bin/env node

// Test script to send prompts to the mirage client
const https = require('http');

const testPrompts = [
  "Transform this into a cyberpunk city",
  "Make this look like a magical forest",
  "Turn this into a space station",
  "Create a medieval castle environment",
  "Make this look like an underwater world"
];

function sendPrompt(text) {
  const data = JSON.stringify({ text });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTest() {
  const promptText = process.argv[2] || testPrompts[Math.floor(Math.random() * testPrompts.length)];
  
  console.log(`🚀 Sending prompt: "${promptText}"`);
  
  try {
    const response = await sendPrompt(promptText);
    console.log('✅ Success:', response.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runTest();
}

module.exports = { sendPrompt };