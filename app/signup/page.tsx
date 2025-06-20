'use client'

import { useState } from 'react'
import SignupForm from '../components/SignupForm'

export default function SignupPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }

  const handleSwitchToLogin = () => {
    window.location.href = '/'
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully. You can now sign in.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SignupForm 
      onSuccess={handleSuccess}
      onSwitchToLogin={handleSwitchToLogin}
    />
  )
} 