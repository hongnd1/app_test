import { configuredAccounts } from "../../data/config/accounts.js";
import { createAccountModel } from "../../models/Account.js";

const SESSION_KEY = "blx_session";
const ACCOUNT_STATE_KEY = "blx_account_state";

function getAccountState() {
  const raw = localStorage.getItem(ACCOUNT_STATE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAccountState(state) {
  localStorage.setItem(ACCOUNT_STATE_KEY, JSON.stringify(state));
}

function hydrateAccount(account) {
  const state = getAccountState();
  const persisted = state[account.username] ?? {};

  return createAccountModel({
    ...account,
    activatedAt: persisted.activatedAt ?? null,
  });
}

function persistActivation(username, activatedAt) {
  const state = getAccountState();
  state[username] = { ...state[username], activatedAt };
  saveAccountState(state);
}

function getTrialStatus(account) {
  if (account.accountType !== "trial") {
    return { expired: false, remainingDays: null, activatedAt: null };
  }

  const activatedAt = account.activatedAt ?? new Date().toISOString();
  const activatedDate = new Date(activatedAt);
  const expiresAt = new Date(activatedDate);
  expiresAt.setDate(expiresAt.getDate() + account.trialDays);

  const diffTime = expiresAt.getTime() - Date.now();
  const remainingDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);

  return {
    expired: diffTime <= 0,
    remainingDays,
    activatedAt,
  };
}

export const accountService = {
  findAccount(username) {
    const account = configuredAccounts.find((item) => item.username === username);
    return account ? hydrateAccount(account) : null;
  },

  activateTrialIfNeeded(account) {
    if (account.accountType !== "trial" || account.activatedAt) {
      return account;
    }

    const activatedAt = new Date().toISOString();
    persistActivation(account.username, activatedAt);

    return createAccountModel({
      ...account,
      activatedAt,
    });
  },

  createSession(account) {
    const trialStatus = getTrialStatus(account);
    const session = {
      username: account.username,
      displayName: account.displayName,
      accountType: account.accountType,
      activatedAt: trialStatus.activatedAt,
      remainingDays: trialStatus.remainingDays,
      expired: trialStatus.expired,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  getActiveSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);
    const account = this.findAccount(session.username);

    if (!account) {
      this.clearSession();
      return null;
    }

    const trialStatus = getTrialStatus(account);
    if (trialStatus.expired) {
      this.clearSession();
      return null;
    }

    return {
      ...session,
      remainingDays: trialStatus.remainingDays,
      expired: trialStatus.expired,
      activatedAt: trialStatus.activatedAt,
    };
  },
};
