'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, EditIcon, EyeIcon } from 'lucide-react'

interface ContentListProps {
  onSelectContent: (contentId: number | null) => void
  selectedContentId: number | null
}

interface ContentItem {
  id: number
  title: string
  description: string
  emoji: string
  section_name: string
  container_type: string
  published: boolean
  created_at: string
}

export default function ContentList({ onSelectContent, selectedContentId }: ContentListProps) {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    try {
      const response = await fetch('/api/content', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setContents(data)
      }
    } catch (error) {
      console.error('Error loading contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContents = contents.filter(content =>
    content.title.toLowerCase().includes(filter.toLowerCase()) ||
    content.description.toLowerCase().includes(filter.toLowerCase()) ||
    content.section_name.toLowerCase().includes(filter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">Loading contents...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Content Items</h2>
          <button
            onClick={() => onSelectContent(null)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
          >
            <PlusIcon size={16} />
            New
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Filter contents..."
          className="w-full p-3 border border-gray-300 rounded-lg"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {filteredContents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filter ? 'No contents match your search' : 'No contents found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedContentId === content.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectContent(content.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{content.emoji}</span>
                      <h3 className="font-medium text-gray-900">{content.title}</h3>
                      {content.published ? (
                        <EyeIcon size={14} className="text-green-600" />
                      ) : (
                        <EditIcon size={14} className="text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {content.section_name}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {content.container_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 