"use client"
import { create } from "zustand"
import { persist, PersistOptions } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  joinDate: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
}

interface VerificationState {
  emailVerificationSent: boolean
  phoneVerificationSent: boolean
  emailVerified: boolean
  phoneVerified: boolean
  verificationMethod: 'email' | 'phone' | null
}

type AuthStore = {
  user: User | null
  isLoggedIn: boolean
  verification: VerificationState
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: {
    email: string
    password: string
    name: string
    phone?: string
  }) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: Partial<User>) => void
  setVerificationMethod: (method: 'email' | 'phone') => void
  setEmailVerificationSent: (sent: boolean) => void
  setPhoneVerificationSent: (sent: boolean) => void
  setEmailVerified: (verified: boolean) => void
  setPhoneVerified: (verified: boolean) => void
  resetVerification: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      verification: {
        emailVerificationSent: false,
        phoneVerificationSent: false,
        emailVerified: false,
        phoneVerified: false,
        verificationMethod: null
      },
      
      login: async (email: string, password: string) => {
        // 실제로는 API 호출
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 간단한 데모용 로그인 (실제로는 서버에서 검증)
        if (email && password.length >= 6) {
          const user: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            joinDate: new Date().toISOString(),
            isEmailVerified: true,
            isPhoneVerified: false
          }
          
          set({ user, isLoggedIn: true })
          return true
        }
        return false
      },
      
      signup: async (userData) => {
        // 실제로는 API 호출
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const user: User = {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          joinDate: new Date().toISOString(),
          isEmailVerified: false,
          isPhoneVerified: false
        }
        
        set({ user, isLoggedIn: true })
        return true
      },
      
      logout: () => {
        set({ 
          user: null, 
          isLoggedIn: false,
          verification: {
            emailVerificationSent: false,
            phoneVerificationSent: false,
            emailVerified: false,
            phoneVerified: false,
            verificationMethod: null
          }
        })
      },
      
      updateProfile: (userData) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },

      setVerificationMethod: (method) => {
        set(state => ({
          verification: { ...state.verification, verificationMethod: method }
        }))
      },

      setEmailVerificationSent: (sent) => {
        set(state => ({
          verification: { ...state.verification, emailVerificationSent: sent }
        }))
      },

      setPhoneVerificationSent: (sent) => {
        set(state => ({
          verification: { ...state.verification, phoneVerificationSent: sent }
        }))
      },

      setEmailVerified: (verified) => {
        set(state => ({
          verification: { ...state.verification, emailVerified: verified }
        }))
      },

      setPhoneVerified: (verified) => {
        set(state => ({
          verification: { ...state.verification, phoneVerified: verified }
        }))
      },

      resetVerification: () => {
        set(state => ({
          verification: {
            emailVerificationSent: false,
            phoneVerificationSent: false,
            emailVerified: false,
            phoneVerified: false,
            verificationMethod: null
          }
        }))
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthStore) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
);
