export function createAccountModel(data) {
  return {
    username: data.username,
    password: data.password,
    displayName: data.displayName,
    accountType: data.accountType,
    trialDays: data.trialDays ?? null,
    activatedAt: data.activatedAt ?? null,
  };
}
