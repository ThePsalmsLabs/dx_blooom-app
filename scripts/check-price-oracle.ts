import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import type { Address } from 'viem'

// Minimal ABI subset for the checks we need
const ORACLE_MIN_ABI = [
  { type: 'function', name: 'quoterV2', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'WETH', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'USDC', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'defaultSlippage', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getETHPrice', stateMutability: 'view', inputs: [{ name: 'usdcAmount', type: 'uint256' }], outputs: [{ name: 'ethAmount', type: 'uint256' }] },
  { type: 'function', name: 'getTokenPrice', stateMutability: 'view', inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'poolFee', type: 'uint24' }
    ], outputs: [{ name: 'amountOut', type: 'uint256' }] },
] as const

async function main() {
  const client = createPublicClient({ chain: base, transport: http() })

  const oracleAddress = (process.env.PRICE_ORACLE_ADDRESS || '0x13056B1dFE38dA0c058e6b2B2e3DaecCEdCEFFfF') as Address

  console.log('Using PriceOracle at:', oracleAddress)

  // Read core config from contract
  const [quoter, weth, usdc, defaultSlippage] = await Promise.all([
    client.readContract({ address: oracleAddress, abi: ORACLE_MIN_ABI as any, functionName: 'quoterV2' as any, args: [] }) as Promise<Address>,
    client.readContract({ address: oracleAddress, abi: ORACLE_MIN_ABI as any, functionName: 'WETH' as any, args: [] }) as Promise<Address>,
    client.readContract({ address: oracleAddress, abi: ORACLE_MIN_ABI as any, functionName: 'USDC' as any, args: [] }) as Promise<Address>,
    client.readContract({ address: oracleAddress, abi: ORACLE_MIN_ABI as any, functionName: 'defaultSlippage' as any, args: [] }) as Promise<bigint>,
  ])

  console.log('quoterV2:', quoter)
  console.log('WETH:', weth)
  console.log('USDC:', usdc)
  console.log('defaultSlippage:', defaultSlippage.toString())

  // Try ETH price for 2 USDC (2_000_000 micro USDC)
  const usdcAmount = BigInt(2000000)
  try {
    const ethAmount = await client.readContract({
      address: oracleAddress,
      abi: ORACLE_MIN_ABI as any,
      functionName: 'getETHPrice' as any,
      args: [usdcAmount]
    }) as bigint
    console.log('getETHPrice(2 USDC) =>', ethAmount.toString(), 'wei')
  } catch (e) {
    console.error('getETHPrice reverted:', e)
  }

  // Try getTokenPrice for 1 ETH with fee=500 to test pool availability
  try {
    const oneEth = BigInt('1000000000000000000')
    const amountOut = await client.readContract({
      address: oracleAddress,
      abi: ORACLE_MIN_ABI as any,
      functionName: 'getTokenPrice' as any,
      args: [weth, usdc, oneEth, 500]
    }) as bigint
    console.log('getTokenPrice(1 ETH -> USDC, 500) =>', amountOut.toString())
  } catch (e) {
    console.error('getTokenPrice(500) reverted:', e)
  }

  // Try getTokenPrice for 1 ETH with fee=3000 to compare
  try {
    const oneEth = BigInt('1000000000000000000')
    const amountOut = await client.readContract({
      address: oracleAddress,
      abi: ORACLE_MIN_ABI as any,
      functionName: 'getTokenPrice' as any,
      args: [weth, usdc, oneEth, 3000]
    }) as bigint
    console.log('getTokenPrice(1 ETH -> USDC, 3000) =>', amountOut.toString())
  } catch (e) {
    console.error('getTokenPrice(3000) reverted:', e)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


