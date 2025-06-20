'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './providers/auth-provider'
import { useTheme } from './providers/theme-provider'
import Header from './components/Header'
import ModuleGrid from './components/ModuleGrid'
import SearchBox from './components/SearchBox'
import LoginForm from './components/LoginForm'

export default function Home() {
  const { user, isLoading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (showLogin && !user) {
    return <LoginForm onCancel={() => setShowLogin(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header showLoginButton={!user} onLoginClick={() => setShowLogin(true)} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            JMSS Staff Infocenter
            {user && <span className="text-lg font-normal block mt-2">Dashboard</span>}
          </h1>
          <SearchBox />
        </div>
        <ModuleGrid />
      </div>
    </div>
  )
} 