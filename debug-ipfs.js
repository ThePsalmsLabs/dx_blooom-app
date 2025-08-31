// Debug script for IPFS upload issue
const http = require('http')

console.log('🔍 Testing IPFS upload API...')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ipfs/upload',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}

const req = http.request(options, (res) => {
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
