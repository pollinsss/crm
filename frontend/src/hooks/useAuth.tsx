import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { UserRole } from '../types'
import { loginApi, registerApi } from '../api/auth'

interface AuthUser {
  id: number
  role: UserRole
  full_name: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    full_name: string,
    password: string,
  ) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

interface JwtPayload {
  sub: string
  role: UserRole
  full_name: string
  exp: number
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as JwtPayload
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        return JSON.parse(stored) as AuthUser
      } catch {
        return null
      }
    }
    return null
  })

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password)
    const decoded = decodeToken(res.access_token)
    const u: AuthUser = {
      id: Number(decoded?.sub ?? 0),
      role: decoded?.role ?? 'manager',
      full_name: decoded?.full_name ?? email.split('@')[0],
    }
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(res.access_token)
    setUser(u)
  }, [])

  const register = useCallback(
    async (email: string, full_name: string, password: string) => {
      const res = await registerApi(email, full_name, password)
      const u: AuthUser = {
        id: res.id,
        role: res.role,
        full_name: res.full_name,
      }
      setUser(u)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!token,
    }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}