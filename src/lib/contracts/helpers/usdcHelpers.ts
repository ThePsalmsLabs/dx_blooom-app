import { type Config } from 'wagmi'
import { type Address, formatUnits, parseUnits } from 'viem'
import { readContract, writeContract } from 'wagmi/actions'
import { ERC20_ABI } from '@/lib/contracts/abis/erc20'

export const USDC_DECIMALS = 6
export const USDC_MAX_APPROVAL = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

export function formatUSDCAmount(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS)
}

export function parseUSDCAmount(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS)
}

// USDC on some chains requires allowance to be set to 0 before changing
export async function safeApproveUSDC(
  config: Config,
  usdcAddress: Address,
  spender: Address,
  amount: bigint,
  userAddress: Address
): Promise<`0x${string}`> {
  const currentAllowance = await readContract(config, {
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, spender]
  })

  // If there's an existing allowance, reset to 0 first (USDC quirk)
  if (currentAllowance > BigInt(0) && amount !== currentAllowance) {
    await writeContract(config, {
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, BigInt(0)]
    })
  }

  // Now set the desired allowance
  return writeContract(config, {
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount]
  })
}
