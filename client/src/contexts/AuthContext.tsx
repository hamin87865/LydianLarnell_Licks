import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCurrentUser, loginUser, logoutUser, signupUser, type AppUser } from "@/lib/appApi";

export interface User extends AppUser {}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  requestUpgrade: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("[Auth] 인증 상태 확인 실패", error);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const nextUser = await signupUser(email, password, name);
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    const nextUser = await loginUser(email, password);
    setUser(nextUser);
  };

  const requestUpgrade = () => {
    if (!user) return;

    const updated: User = {
      ...user,
      upgradeRequestStatus: "pending",
    };

    setUser(updated);
  };

  const logout = () => {
    setUser(null);
    logoutUser().catch(() => undefined);
  };

  if (!initialized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#111" }}>
        인증 상태 확인 중...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        requestUpgrade,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}