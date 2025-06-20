'use client'

import { useState } from 'react'
import { useAuth } from '../providers/auth-provider'
import { useTheme } from '../providers/theme-provider'
import { ChevronDownIcon, SunIcon, MoonIcon, LogInIcon } from 'lucide-react'

interface HeaderProps {
  showLoginButton?: boolean
  onLoginClick?: () => void
}

export default function Header({ showLoginButton = false, onLoginClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="bg-primary dark:bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-xl sm:text-2xl font-bold">
            JMSS Staff Infocenter
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {user?.role === 'admin' || user?.role === 'editor' ? (
              <a
                href="/editor"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Editor Dashboard</span>
                <span className="sm:hidden">Editor</span>
              </a>
            ) : null}
            
            {showLoginButton && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                <LogInIcon size={16} />
                <span className="hidden sm:inline">Staff Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
            </button>
            
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-white hover:bg-opacity-20 px-2 sm:px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">{user?.name}</span>
                  <span className="sm:hidden text-sm">{user?.name?.split(' ')[0]}</span>
                  <ChevronDownIcon size={16} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {user?.email}
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        Role: {user?.role}
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 