type BorrowerLike = {
  name: string | null;
  email: string;
  deletedAt?: Date | null;
};

function baseAccountLabel(user: BorrowerLike): string {
  const name = user.name?.trim();
  if (name) return name;
  if (user.email) return user.email;
  return "Unknown account";
}

/** Label for checkout / loan UIs (borrower may be deactivated but row still exists). */
export function checkoutBorrowerLabel(user: BorrowerLike | null | undefined): string {
  if (!user) {
    return "Unknown borrower (user record missing)";
  }
  const base = baseAccountLabel(user);
  return user.deletedAt ? `${base} (deactivated)` : base;
}

/** Same as `checkoutBorrowerLabel` but without the orphan message (for known joins). */
export function accountDisplayLabel(user: BorrowerLike): string {
  const base = baseAccountLabel(user);
  return user.deletedAt ? `${base} (deactivated)` : base;
}
