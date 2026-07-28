import { useState, useCallback, useEffect } from 'react';
import type { AppDatabase, User } from '../models/types';
import { authService } from '../services/authService';

const SESSION_KEY = 'storeflow_session_v1';

export function useAuthController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const login = useCallback(
    (email: string, password: string) => {
      const user = db.users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password &&
          u.active
      );
      if (user) {
        setCurrentUser(user);
        addLog('Inicio de sesión', `El usuario ${user.name} (${user.role}) inició sesión`);
        return true;
      }
      return false;
    },
    [db.users, addLog]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      addLog('Cierre de sesión', `El usuario ${currentUser.name} cerró sesión`);
    }
    setCurrentUser(null);
  }, [currentUser, addLog]);

  const upsertUser = useCallback(
    (u: User) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.users.some((x) => x.id === u.id);
        isNew = !exists;
        const users = exists
          ? prev.users.map((x) => (x.id === u.id ? u : x))
          : [...prev.users, u];
        return { ...prev, users };
      });

      addLog('Gestión de Usuarios', `Usuario "${u.name}" (${u.role}) ${isNew ? 'registrado' : 'actualizado'}`);
      authService.upsertUser(u).catch(console.error);
    },
    [setDb, addLog]
  );

  const deleteUser = useCallback(
    (id: string) => {
      setDb((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id),
      }));

      addLog('Gestión de Usuarios', `Usuario ID ${id} eliminado`);
      authService.deleteUser(id).catch(console.error);
    },
    [setDb, addLog]
  );

  return {
    currentUser,
    setCurrentUser,
    login,
    logout,
    upsertUser,
    deleteUser,
  };
}
