// Test Pinata JWT token directly
require('dotenv').config({ path: '.env.local' })

const https = require('https')

console.log('🔍 Testing Pinata JWT token...')

const options = {
  hostname: 'api.pinata.cloud',
  port: 443,
  path: '/data/testAuthentication',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.PINATA_JWT}`,
    'Content-Type': 'application/json'
  }
}

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers:`, res.headers)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data)
      console.log('Response:', JSON.stringify(jsonData, null, 2))
    } catch (e) {
      console.log('Raw Response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.setTimeout(10000, () => {
  console.error('Request timeout')
  req.destroy()
})

req.end()

