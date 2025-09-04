// src/app/api/ipfs/upload/route.ts - REAL IPFS IMPLEMENTATION
import { NextRequest, NextResponse } from 'next/server'

/**
 * Real IPFS Upload API Route using Pinata
 * 
 * This implementation actually uploads files to IPFS via Pinata service
 * and returns real IPFS hashes that can be used to retrieve content.
 * 
 * Setup Required:
 * 1. Sign up at https://pinata.cloud/
 * 2. Get your JWT token from API Keys section
 * 3. Add PINATA_JWT to your environment variables
 */

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

interface PinataError {
  error: {
    reason: string
    details: string
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting real IPFS upload via Pinata...')

    // Check if Pinata is configured
    const pinataJWT = process.env.PINATA_JWT
    if (!pinataJWT) {
      console.error('❌ PINATA_JWT environment variable not configured')
      return NextResponse.json(
        {
          error: 'IPFS service not configured',
          details: 'Server missing PINATA_JWT environment variable',
          setupRequired: true
        },
        { status: 500 }
      )
    }

    // Check NEXT_PUBLIC_PINATA_GATEWAY
    const gatewayDomain = process.env.NEXT_PUBLIC_PINATA_GATEWAY
    
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in request' },
        { status: 400 }
      )
    }
    
    console.log('📁 File received for IPFS upload:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Enhanced file validation
    const maxSize = 50 * 1024 * 1024 // 50MB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'File too large', 
          details: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit`,
          maxSizeAllowed: '50MB'
        },
        { status: 400 }
      )
    }
    
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Empty file not allowed' },
        { status: 400 }
      )
    }
    
    // Comprehensive file type validation with enhanced markdown support
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/mov', 'video/avi',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
      // Documents
      'application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown', 'text/html',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Archives
      'application/zip', 'application/x-rar-compressed',
      // Code files
      'text/javascript', 'text/css', 'application/json',
      // Additional formats
      'text/csv', 'application/csv',
      'application/octet-stream' // Generic binary files
    ]
    
    if (!allowedTypes.includes(file.type) && file.type) {
      return NextResponse.json(
        { 
          error: 'File type not supported', 
          details: `File type "${file.type}" is not in the allowed list`,
          allowedTypes: allowedTypes
        },
        { status: 400 }
      )
    }
    
    // Create FormData for Pinata upload
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    
    // Add metadata to help with content management
    const metadata = {
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString(),
        fileType: file.type,
        platform: 'content-subscription-platform'
      }
    }
    pinataFormData.append('pinataMetadata', JSON.stringify(metadata))
    
    // Configure pinning options for better performance
    const pinataOptions = {
      cidVersion: 1, // Use CID v1 for better compatibility
      wrapWithDirectory: false // Don't wrap single files in directory
    }
    pinataFormData.append('pinataOptions', JSON.stringify(pinataOptions))
    
    console.log('📤 Uploading to Pinata IPFS...')

    try {
      // Upload to Pinata IPFS
      const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
          // Note: Don't set Content-Type header when using FormData
          // The browser will set it automatically with the boundary
        },
        body: pinataFormData,
      })
    
    const responseText = await pinataResponse.text()
    console.log('📨 Pinata response status:', pinataResponse.status)
    console.log('📨 Pinata response:', responseText)
    
    if (!pinataResponse.ok) {
      let errorMessage = 'Unknown Pinata error'
      try {
        const errorData: PinataError = JSON.parse(responseText)
        errorMessage = errorData.error?.reason || errorData.error?.details || responseText
      } catch {
        errorMessage = responseText || `HTTP ${pinataResponse.status}: ${pinataResponse.statusText}`
      }
      
      console.error('❌ Pinata upload failed:', errorMessage)
      return NextResponse.json(
        { 
          error: 'IPFS upload failed', 
          details: errorMessage,
          provider: 'Pinata'
        },
        { status: pinataResponse.status }
      )
    }
    
    const result: PinataResponse = JSON.parse(responseText)
    
    // Validate the returned hash
    if (!result.IpfsHash || result.IpfsHash.length < 10) {
      console.error('❌ Invalid IPFS hash returned from Pinata:', result)
      return NextResponse.json(
        { 
          error: 'Invalid IPFS hash returned', 
          details: 'Pinata returned an invalid or empty IPFS hash'
        },
        { status: 500 }
      )
    }
    
    // Verify the hash format (should be valid CID)
    const hash = result.IpfsHash
    const isValidCID = validateIPFSHash(hash)
    const GATEWAY_DOMAIN = process.env.NEXT_PUBLIC_PINATA_GATEWAY
    
    if (!isValidCID) {
      console.error('❌ Pinata returned invalid CID format:', hash)
      return NextResponse.json(
        { 
          error: 'Invalid IPFS hash format', 
          details: 'The returned hash is not a valid IPFS Content Identifier'
        },
        { status: 500 }
      )
    }
    
    console.log('✅ IPFS upload successful!')
    console.log('📋 Upload details:', {
      hash: hash,
      size: result.PinSize,
      gateway: `https://${GATEWAY_DOMAIN}/${hash}`,
      timestamp: result.Timestamp
    })
    
    // Return success response with all necessary information
    const cleanGatewayDomain = (GATEWAY_DOMAIN || 'gateway.pinata.cloud/ipfs').replace(/^https?:\/\//, '').replace(/\/+$/, '')
    const gatewayUrl = `https://${cleanGatewayDomain}/${hash}`

    return NextResponse.json({
      success: true,
      hash: hash,
      ipfsHash: hash, // Alias for compatibility
      size: result.PinSize,
      gateway: gatewayUrl,
      timestamp: result.Timestamp,
      message: 'File uploaded successfully to IPFS',
      provider: 'Pinata'
    })
    
    } catch (pinataError) {
      // Better error handling for fetch failures
      let errorMessage = 'Unknown Pinata upload error'

      if (pinataError instanceof TypeError && pinataError.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to IPFS service. Please check your internet connection.'
      } else if (pinataError instanceof Error) {
        errorMessage = pinataError.message
      } else if (typeof pinataError === 'string') {
        errorMessage = pinataError
      } else {
        try {
          errorMessage = JSON.stringify(pinataError)
        } catch {
          errorMessage = String(pinataError)
        }
      }

      console.error('❌ Pinata upload error:', errorMessage)
      throw new Error(errorMessage) // Re-throw with better message
    }

  } catch (error) {
    console.error('💥 IPFS upload error:', error instanceof Error ? error.message : String(error))

    // Provide detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Failed to upload file to IPFS',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Enhanced IPFS hash validation that supports both CID v0 and v1 formats
 * This is the same validation logic used in the frontend workflow
 */
function validateIPFSHash(hash: string): boolean {
  if (!hash || hash.length < 10) {
    return false
  }
  
  // Check for CID v0 (starts with Qm and is exactly 46 characters)
  if (hash.startsWith('Qm') && hash.length === 46) {
    // Additional validation: check if it's valid base58
    const base58Pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
    return base58Pattern.test(hash)
  }
  
  // Check for CID v1 (various prefixes, minimum 32 characters)
  const cidV1Prefixes = [
    'baf', 'bae', 'bag', 'bah', 'bai', 'baj', 'bak', 'bal', 'bam', 'ban', 'bao', 'bap',
    'baq', 'bar', 'bas', 'bat', 'bau', 'bav', 'baw', 'bax', 'bay', 'baz'
  ]
  
  const hasValidPrefix = cidV1Prefixes.some(prefix => hash.startsWith(prefix))
  if (hasValidPrefix && hash.length >= 32) {
    // Additional validation for common CID v1 patterns
    return /^[a-z2-7]+$/.test(hash) // Base32 encoding check
  }
  
  return false
}

/**
 * GET endpoint for testing IPFS service availability
 */
export async function GET() {
  const pinataJWT = process.env.PINATA_JWT

  if (!pinataJWT) {
    return NextResponse.json({
      status: 'error',
      message: 'IPFS service not configured',
      details: 'PINATA_JWT environment variable is missing',
      setupInstructions: [
        '1. Sign up at https://pinata.cloud/',
        '2. Generate a JWT token in API Keys section',
        '3. Add PINATA_JWT=your_jwt_token to your .env.local file',
        '4. Restart your development server'
      ]
    }, { status: 500 })
  }

  try {
    console.log('🔍 Testing IPFS service connectivity...')

    // Test basic connectivity first
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const testResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (testResponse.ok) {
      return NextResponse.json({
        status: 'success',
        message: 'IPFS service is properly configured and accessible',
        provider: 'Pinata',
        endpoint: '/api/ipfs/upload',
        connectivity: 'good',
        timestamp: new Date().toISOString()
      })
    } else {
      const errorText = await testResponse.text()
      console.error('❌ Pinata authentication failed:', errorText)

      return NextResponse.json({
        status: 'error',
        message: 'IPFS service authentication failed',
        details: `HTTP ${testResponse.status}: ${errorText || testResponse.statusText}`,
        suggestions: [
          'Verify your PINATA_JWT token is correct',
          'Check your Pinata account status',
          'Ensure your token has the required permissions'
        ]
      }, { status: testResponse.status })
    }
  } catch (error) {
    // Type guard to check if error is an instance of Error
    const isError = error instanceof Error
    const errorMessage = isError ? error.message : 'Unknown error occurred'

    console.error('❌ IPFS connectivity test failed:', errorMessage)

    // Provide helpful diagnostics for different error types
    let responseErrorMessage = 'Failed to connect to IPFS service'
    let suggestions = [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ]

    if (isError && error.name === 'AbortError') {
      responseErrorMessage = 'Connection timeout to IPFS service'
      suggestions = [
        'Check your internet connection speed',
        'The service might be temporarily unavailable',
        'Try again later'
      ]
    } else if (isError && (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED'))) {
      responseErrorMessage = 'DNS resolution or network connectivity issue'
      suggestions = [
        'Check your DNS settings',
        'Verify your firewall/proxy settings',
        'Try using a different network'
      ]
    }

    return NextResponse.json({
      status: 'error',
      message: responseErrorMessage,
      details: errorMessage,
      suggestions: suggestions,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    }, { status: 503 })
  }
}