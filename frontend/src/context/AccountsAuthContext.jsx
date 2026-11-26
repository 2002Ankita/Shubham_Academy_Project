import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import accountsService from '../services/accountsService';
import { useAuth } from '../hooks/useAuth';
import { getUserBranch } from '../utils/branchUtils';
import { normalizeBranch, BRANCH_TARABAI, BRANCH_MANGALWAR } from '../config/branchBatchConfig';

const AccountsAuthContext = createContext(null);

export function AccountsAuthProvider({ children }) {
  const { user } = useAuth();
  const currentRole = (user?.role || '').toLowerCase();
  const isSuperAdmin = currentRole === 'super_admin' || currentRole.includes('super');
  const userBranch = getUserBranch(user) || BRANCH_TARABAI;

  const [isAccountsUnlocked, setIsAccountsUnlocked] = useState(() => {
    // If super admin is already logged in, they have master access
    if (isSuperAdmin) return true;
    try {
      return sessionStorage.getItem('sa_accounts_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [unlockedBranch, setUnlockedBranch] = useState(() => {
    try {
      return sessionStorage.getItem('sa_accounts_branch') || userBranch;
    } catch {
      return userBranch;
    }
  });

  const [accountsRole, setAccountsRole] = useState(() => {
    try {
      return sessionStorage.getItem('sa_accounts_role') || (isSuperAdmin ? 'super_admin' : '');
    } catch {
      return '';
    }
  });

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [targetRoute, setTargetRoute] = useState(null);
  const [modalBranch, setModalBranch] = useState(userBranch);

  // If superadmin logs in, automatically grant master access
  useEffect(() => {
    if (isSuperAdmin) {
      setIsAccountsUnlocked(true);
      setAccountsRole('super_admin');
    }
  }, [isSuperAdmin]);

  const unlockAccounts = async (accountsId, password, targetBranch) => {
    const branchToUse = targetBranch || userBranch || BRANCH_MANGALWAR;
    try {
      const res = await accountsService.verify({
        accounts_id: accountsId,
        password,
        branch: branchToUse
      });

      if (res.success) {
        setIsAccountsUnlocked(true);
        const effectiveBranch = res.branch || branchToUse;
        setUnlockedBranch(effectiveBranch);
        setAccountsRole(res.role || 'accounts_admin');

        try {
          sessionStorage.setItem('sa_accounts_unlocked', 'true');
          sessionStorage.setItem('sa_accounts_branch', effectiveBranch);
          sessionStorage.setItem('sa_accounts_role', res.role || 'accounts_admin');
        } catch (e) {
          console.warn('Could not store accounts session:', e);
        }

        setIsUnlockModalOpen(false);
        toast.success(`Accounts Unlocked for ${effectiveBranch}!`);
        return { success: true, targetRoute };
      } else {
        toast.error(res.message || 'Invalid Accounts ID or Password.');
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Invalid Accounts ID or Password.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const lockAccounts = () => {
    // Note: Super Admin can re-lock accounts for testing or leaving screen
    setIsAccountsUnlocked(false);
    setAccountsRole('');
    try {
      sessionStorage.removeItem('sa_accounts_unlocked');
      sessionStorage.removeItem('sa_accounts_branch');
      sessionStorage.removeItem('sa_accounts_role');
    } catch (e) {
      console.warn('Could not clear accounts session:', e);
    }
    toast.success('Accounts session locked.');
  };

  const openAccountsModal = (route = null, branch = null) => {
    setTargetRoute(route);
    setModalBranch(branch || userBranch || BRANCH_TARABAI);
    setIsUnlockModalOpen(true);
  };

  const closeAccountsModal = () => {
    setIsUnlockModalOpen(false);
    setTargetRoute(null);
  };

  return (
    <AccountsAuthContext.Provider
      value={{
        isAccountsUnlocked,
        unlockedBranch,
        accountsRole,
        isSuperAdmin,
        isUnlockModalOpen,
        targetRoute,
        modalBranch,
        unlockAccounts,
        lockAccounts,
        openAccountsModal,
        closeAccountsModal,
        setModalBranch
      }}
    >
      {children}
    </AccountsAuthContext.Provider>
  );
}

export function useAccountsAuth() {
  const ctx = useContext(AccountsAuthContext);
  if (!ctx) {
    throw new Error('useAccountsAuth must be used within an AccountsAuthProvider');
  }
  return ctx;
}

export default AccountsAuthContext;
