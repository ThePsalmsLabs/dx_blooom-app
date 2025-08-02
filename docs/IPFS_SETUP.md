# IPFS Integration Setup Guide

This guide explains how to set up real IPFS integration for the content upload functionality.

## Current Implementation

The current implementation uses a mock IPFS upload that simulates the upload process and returns a fake hash. This is located in:

- **API Route**: `src/app/api/ipfs/upload/route.ts`
- **Frontend**: `src/components/content/ContentUpload.tsx`

## Setting Up Real IPFS Integration

### Option 1: Pinata (Recommended)

1. **Sign up for Pinata**:
   - Go to [https://pinata.cloud/](https://pinata.cloud/)
   - Create an account and get your API keys

2. **Install Pinata SDK**:
   ```bash
   npm install @pinata/sdk
   ```

3. **Update the API route** (`src/app/api/ipfs/upload/route.ts`):
   ```typescript
   import { PinataSDK } from '@pinata/sdk'
   
   const pinata = new PinataSDK({ 
     pinataJWTKey: process.env.PINATA_JWT 
   })
   
   // In the POST function:
   const result = await pinata.pinFileToIPFS(file)
   return NextResponse.json({ hash: result.IpfsHash })
   ```

4. **Add environment variable**:
   ```env
   PINATA_JWT=your_pinata_jwt_token_here
   ```

### Option 2: Infura IPFS

1. **Sign up for Infura**:
   - Go to [https://infura.io/](https://infura.io/)
   - Create a project and get your credentials

2. **Update the API route**:
   ```typescript
   const formData = new FormData()
   formData.append('file', file)
   
   const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
     method: 'POST',
     body: formData,
     headers: {
       'Authorization': `Basic ${Buffer.from(
         process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET
       ).toString('base64')}`
     }
   })
   
   const result = await response.json()
   return NextResponse.json({ hash: result.Hash })
   ```

3. **Add environment variables**:
   ```env
   INFURA_PROJECT_ID=your_project_id
   INFURA_PROJECT_SECRET=your_project_secret
   ```

### Option 3: Web3.Storage

1. **Sign up for Web3.Storage**:
   - Go to [https://web3.storage/](https://web3.storage/)
   - Create an account and get your API token

2. **Install Web3.Storage**:
   ```bash
   npm install web3.storage
   ```

3. **Update the API route**:
   ```typescript
   import { Web3Storage } from 'web3.storage'
   
   const client = new Web3Storage({ 
     token: process.env.WEB3_STORAGE_TOKEN 
   })
   
   const cid = await client.put([file])
   return NextResponse.json({ hash: cid })
   ```

4. **Add environment variable**:
   ```env
   WEB3_STORAGE_TOKEN=your_web3_storage_token
   ```

## Testing the Integration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the API endpoint**:
   ```bash
   curl -X GET http://localhost:3000/api/ipfs/upload/test
   ```

3. **Test file upload**:
   - Go to your content upload page
   - Try uploading a file
   - Check the browser console for logs
   - Verify the IPFS hash is returned

## Error Handling

The current implementation includes comprehensive error handling:

- **File size validation**: 50MB limit
- **File type validation**: Supported formats only
- **Network errors**: Proper error messages for failed requests
- **API errors**: Detailed error responses from IPFS services

## Production Considerations

1. **Rate limiting**: Implement rate limiting for the upload endpoint
2. **File size limits**: Consider adjusting based on your IPFS service limits
3. **Caching**: Cache IPFS hashes to avoid re-uploading identical files
4. **Monitoring**: Add logging and monitoring for upload success/failure rates
5. **Backup**: Consider using multiple IPFS services for redundancy

## Troubleshooting

### Common Issues

1. **404 Error**: Make sure the API route is properly created
2. **CORS Error**: Check if your IPFS service allows requests from your domain
3. **File Size Error**: Verify the file is under the 50MB limit
4. **Authentication Error**: Check your API keys and environment variables

### Debug Steps

1. Check browser console for error messages
2. Verify API endpoint is accessible: `http://localhost:3000/api/ipfs/upload/test`
3. Check server logs for detailed error information
4. Test with a small file first (under 1MB)

## Migration from Mock to Real IPFS

When migrating from the mock implementation:

1. **Backup current data**: Ensure you have backups of any existing content
2. **Test thoroughly**: Test with various file types and sizes
3. **Update documentation**: Update any documentation that references the mock implementation
4. **Monitor performance**: Watch for any performance impacts
5. **Plan rollback**: Have a plan to rollback if issues arise 