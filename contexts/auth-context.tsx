// Authentication context provider for PDF to QuickBooks application
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for cached auth state first (only on client side)
    if (typeof window !== 'undefined') {
      const cachedAuth = localStorage.getItem('pdf-to-quickbooks-auth')
      if (cachedAuth) {
        try {
          const { user: cachedUser, session: cachedSession, timestamp } = JSON.parse(cachedAuth)
          // Check if cache is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            setUser(cachedUser)
            setSession(cachedSession)
            setLoading(false)
          }
        } catch (error) {
          console.warn('Failed to parse cached auth:', error)
          localStorage.removeItem('pdf-to-quickbooks-auth')
        }
      }
    }

    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Cache the session if it exists (only on client side)
      if (typeof window !== 'undefined') {
        if (session) {
          localStorage.setItem('pdf-to-quickbooks-auth', JSON.stringify({
            user: session.user,
            session: session,
            timestamp: Date.now()
          }))
        } else {
          localStorage.removeItem('pdf-to-quickbooks-auth')
        }
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Update cache when auth state changes (only on client side)
      if (typeof window !== 'undefined') {
        if (session) {
          localStorage.setItem('pdf-to-quickbooks-auth', JSON.stringify({
            user: session.user,
            session: session,
            timestamp: Date.now()
          }))
        } else {
          localStorage.removeItem('pdf-to-quickbooks-auth')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear local state immediately
      setUser(null)
      setSession(null)
      setLoading(false)
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pdf-to-quickbooks-auth')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear local state even if Supabase signOut fails
      setUser(null)
      setSession(null)
      setLoading(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pdf-to-quickbooks-auth')
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
