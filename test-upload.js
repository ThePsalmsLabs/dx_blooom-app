// Test IPFS upload with a small file
const fs = require('fs')
const FormData = require('form-data')
const http = require('http')

console.log('🔍 Testing IPFS upload with a small file...')

// Create a small test file
const testContent = 'Hello IPFS World! This is a test file.'
fs.writeFileSync('/tmp/test-file.txt', testContent)

const form = new FormData()
form.append('file', fs.createReadStream('/tmp/test-file.txt'), {
  filename: 'test-file.txt',
  contentType: 'text/plain'
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ipfs/upload',
  method: 'POST',
  headers: form.getHeaders()
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers:`, res.headers)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('Raw Response Length:', data.length)
    try {
      const jsonData = JSON.parse(data)
      console.log('Response:', JSON.stringify(jsonData, null, 2))
    } catch (e) {
      console.log('Raw Response:', data.substring(0, 500))
      if (data.length > 500) {
        console.log('... (truncated)')
      }
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.setTimeout(30000, () => {
  console.error('Request timeout')
  req.destroy()
})

// Pipe the form data to the request
form.pipe(req)

