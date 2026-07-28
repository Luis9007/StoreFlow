/**
 * @file AuthController.ts
 * @description Controlador Hook de React para sesión de usuario, autenticación local y gestión de credenciales.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/authService.ts`):
 * - Maneja el estado en React del usuario activo (`currentUser`) y la persistencia de sesión en `sessionStorage`.
 * - Sincroniza la gestión de usuarios con Supabase mediante `authService`:
 *    • `upsertUser()` ➔ llama a `authService.upsertUser(u)`
 *    • `deleteUser()` ➔ llama a `authService.deleteUser(id)`
 */

import { useState, useCallback, useEffect } from 'react';
import type { AppDatabase, User } from '../models/types';
import { authService } from '../services/authService';

const SESSION_KEY = 'storeflow_session_v1';

/**
 * Custom Hook que encapsula la lógica de autenticación, login, logout y administración de usuarios.
 */
export function useAuthController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
  // Estado del usuario con inicio desde sessionStorage para mantener la sesión tras recargar la página
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // Efecto que persiste o borra la sesión en sessionStorage cuando cambia currentUser
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  /**
   * Autentica un usuario comparando email, contraseña y estado activo en la base de datos en memoria.
   */
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

  /**
   * Cierra la sesión activa del usuario.
   */
  const logout = useCallback(() => {
    if (currentUser) {
      addLog('Cierre de sesión', `El usuario ${currentUser.name} cerró sesión`);
    }
    setCurrentUser(null);
  }, [currentUser, addLog]);

  /**
   * Registra un nuevo usuario o actualiza sus datos/rol.
   * 1. Actualiza el estado local en React (`setDb`).
   * 2. Registra en la bitácora (`addLog`).
   * 3. Sincroniza con el backend llamando a `authService.upsertUser(u)`.
   */
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

  /**
   * Elimina un usuario del sistema por su ID.
   * 1. Filtra y remueve del estado en React.
   * 2. Registra en la bitácora.
   * 3. Elimina en Supabase vía `authService.deleteUser(id)`.
   */
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
