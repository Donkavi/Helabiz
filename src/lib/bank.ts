import "server-only";

/**
 * The account subscribers deposit into.
 *
 * Configuration rather than code: it is the operator's own bank account, it
 * changes without a deploy, and a fork of this project must not inherit it.
 * Unset, bank transfer is simply not offered.
 */
export type BankDetails = {
  bank: string;
  branch?: string;
  accountName: string;
  accountNumber: string;
};

export function bankDetails(): BankDetails | null {
  const bank = process.env.BANK_NAME?.trim();
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER?.trim();
  if (!bank || !accountName || !accountNumber) return null;

  return { bank, branch: process.env.BANK_BRANCH?.trim() || undefined, accountName, accountNumber };
}
