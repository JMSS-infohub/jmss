'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../providers/auth-provider'
import Header from '../components/Header'
import ContentEditor from '../components/ContentEditor'
import ContentList from '../components/ContentList'
import SectionManagement from '../components/SectionManagement'
import UserManagement from '../components/UserManagement'

export default function EditorDashboard() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('content')
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-red-600 dark:text-red-400">Access denied. Admin or Editor role required.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Editor Dashboard</h1>
          
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-primary text-primary dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Content Management
              </button>
              <button
                onClick={() => setActiveTab('sections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sections'
                    ? 'border-primary text-primary dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Sections
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-primary text-primary dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  User Management
                </button>
              )}
            </nav>
          </div>
        </div>

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ContentList 
                onSelectContent={setSelectedContentId}
                selectedContentId={selectedContentId}
              />
            </div>
            <div className="lg:col-span-2">
              <ContentEditor 
                contentId={selectedContentId}
                onContentSaved={() => {
                  // Refresh the content list when content is saved
                  window.location.reload()
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <SectionManagement />
        )}

        {activeTab === 'users' && user.role === 'admin' && (
          <UserManagement />
        )}
      </div>
    </div>
  )
} 