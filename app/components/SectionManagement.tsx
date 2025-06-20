'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: number
  name: string
  description: string
  emoji: string
  order_index: number
  created_at: string
  updated_at: string
}

export default function SectionManagement() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '',
    order_index: 0
  })

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSection ? `/api/sections/${editingSection.id}` : '/api/sections'
      const method = editingSection ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchSections()
        resetForm()
        alert(editingSection ? 'Section updated successfully!' : 'Section created successfully!')
      } else {
        alert('Error saving section')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error saving section')
    }
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      description: section.description,
      emoji: section.emoji,
      order_index: section.order_index
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all content in this section.')) {
      return
    }

    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSections()
        alert('Section deleted successfully!')
      } else {
        alert('Error deleting section')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Error deleting section')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      emoji: '',
      order_index: 0
    })
    setEditingSection(null)
    setShowAddForm(false)
  }

  const moveSection = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === id)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const updatedSections = [...sections]
    const temp = updatedSections[currentIndex].order_index
    updatedSections[currentIndex].order_index = updatedSections[newIndex].order_index
    updatedSections[newIndex].order_index = temp

    try {
      await Promise.all([
        fetch(`/api/sections/${updatedSections[currentIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: updatedSections[currentIndex].order_index })
        }),
        fetch(`/api/sections/${updatedSections[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: updatedSections[newIndex].order_index })
        })
      ])
      
      await fetchSections()
    } catch (error) {
      console.error('Error reordering sections:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading sections...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Section Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Add New Section
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingSection ? 'Edit Section' : 'Add New Section'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="🏊"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Index
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                {editingSection ? 'Update Section' : 'Create Section'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Existing Sections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sections.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No sections found. Create your first section to get started.
            </div>
          ) : (
            sections.map((section, index) => (
              <div key={section.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{section.emoji}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{section.name}</h4>
                    <p className="text-sm text-gray-500">{section.description}</p>
                    <p className="text-xs text-gray-400">Order: {section.order_index}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 