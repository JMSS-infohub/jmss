'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, SaveIcon, TrashIcon } from 'lucide-react'
import RichTextEditor from './RichTextEditor'

interface ContentEditorProps {
  contentId: number | null
  onContentSaved?: () => void
}

interface ContentItem {
  id?: number
  title: string
  description: string
  emoji: string
  section_id: number
  container_type: string
  content: any
  published: boolean
}

const containerTypes = [
  { type: 'text', name: 'Text Block', description: 'Simple text content with formatting' },
  { type: 'list', name: 'Ordered List', description: 'Numbered or bulleted list items' },
  { type: 'procedure', name: 'Procedure Steps', description: 'Step-by-step procedures with icons' },
  { type: 'warning', name: 'Warning Box', description: 'Important warnings and notices' },
  { type: 'success', name: 'Success Box', description: 'Success messages and confirmations' },
  { type: 'danger', name: 'Danger Box', description: 'Critical alerts and errors' },
  { type: 'quiz', name: 'Quiz Container', description: 'Interactive quiz with questions and answers' },
  { type: 'grid', name: 'Data Grid', description: 'Tabular data display' },
  { type: 'tabs', name: 'Tab Container', description: 'Tabbed content organization' }
]

export default function ContentEditor({ contentId, onContentSaved }: ContentEditorProps) {
  const [content, setContent] = useState<ContentItem>({
    title: '',
    description: '',
    emoji: '',
    section_id: 1,
    container_type: 'text',
    content: { text: '' },
    published: false
  })
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSections()
  }, [])

  useEffect(() => {
    if (contentId) {
      loadContent(contentId)
    } else {
      resetForm()
    }
  }, [contentId, sections])

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data)
        
        if (!contentId && data.length > 0) {
          setContent(prev => ({
            ...prev,
            section_id: data[0].id
          }))
        }
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadContent = async (id: number) => {
    setIsLoading(true)
    try {
      console.log('Loading content for ID:', id)
      const response = await fetch(`/api/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('Content response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded content data:', data)
        
        // Smart content processing to convert complex JSON to editable format
        const processedContent = processComplexContent(data)
        setContent(processedContent)
      } else {
        console.error('Failed to load content, status:', response.status)
      }
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Process complex content to make it editable
  const processComplexContent = (data: any) => {
    const processed = { ...data }
    
    // Handle complex nested structures in content
    if (processed.content && typeof processed.content === 'object') {
      const content = processed.content
      
      // Convert complex tab structures
      if (content.tabs && Array.isArray(content.tabs)) {
        processed.container_type = 'tabs'
        processed.content = {
          tabs: content.tabs.map((tab: any) => ({
            title: tab.title || '',
            content: extractTextFromComplexContent(tab.content) || ''
          }))
        }
      }
      
      // Convert procedure-like structures
      else if (content.steps || content.items) {
        if (content.steps) {
          processed.container_type = 'procedure'
          processed.content = {
            steps: content.steps.map((step: any) => ({
              icon: step.icon || '',
              title: step.title || '',
              description: step.description || extractTextFromComplexContent(step) || ''
            }))
          }
        } else if (content.items) {
          processed.container_type = 'list'
          processed.content = {
            items: content.items.map((item: any) => 
              typeof item === 'string' ? item : extractTextFromComplexContent(item) || ''
            )
          }
        }
      }
      
      // Convert grid-like structures
      else if (content.headers || content.rows || content.table) {
        processed.container_type = 'grid'
        processed.content = {
          headers: content.headers || content.table?.headers || [],
          rows: content.rows || content.table?.rows || []
        }
      }
      
      // Convert warning/alert structures
      else if (content.type && ['warning', 'success', 'danger', 'info'].includes(content.type)) {
        processed.container_type = content.type === 'info' ? 'warning' : content.type
        processed.content = {
          title: content.title || '',
          message: content.message || extractTextFromComplexContent(content) || ''
        }
      }
      
      // Convert quiz structures
      else if (content.questions || content.quiz) {
        processed.container_type = 'quiz'
        const questions = content.questions || content.quiz?.questions || []
        processed.content = {
          title: content.title || content.quiz?.title || '',
          questions: questions.map((q: any) => ({
            question: q.question || q.text || '',
            options: q.options || q.answers || ['', ''],
            correct: q.correct || q.correctAnswer || 0
          }))
        }
      }
      
      // Fallback: convert any complex structure to simple text
      else if (hasComplexStructure(content)) {
        processed.container_type = 'text'
        processed.content = {
          text: extractTextFromComplexContent(content) || ''
        }
      }
    }
    
    return processed
  }

  // Check if content has complex nested structures
  const hasComplexStructure = (content: any): boolean => {
    if (typeof content !== 'object' || content === null) return false
    
    return Object.values(content).some(value => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.some(item => typeof item === 'object' && item !== null)
        } else {
          return Object.keys(value).length > 0
        }
      }
      return false
    })
  }

  // Extract readable text from complex content structures
  const extractTextFromComplexContent = (content: any): string => {
    if (typeof content === 'string') return content
    if (typeof content !== 'object' || content === null) return String(content || '')
    
    // Handle different content types
    if (content.text) return content.text
    if (content.content) return extractTextFromComplexContent(content.content)
    if (content.message) return content.message
    if (content.description) return content.description
    if (content.title) return content.title
    
    // Handle arrays
    if (Array.isArray(content)) {
      return content.map(item => extractTextFromComplexContent(item)).join('\n')
    }
    
    // Handle objects - concatenate values
    const values = Object.values(content)
      .map(value => extractTextFromComplexContent(value))
      .filter(text => text && text.trim())
    
    return values.join('\n')
  }

  const resetForm = () => {
    setContent({
      title: '',
      description: '',
      emoji: '',
      section_id: sections.length > 0 ? (sections as any)[0].id : 0,
      container_type: 'text',
      content: {},
      published: true
    })
  }

  const handleSave = async () => {
    // Validate required fields
    if (!content.title.trim()) {
      alert('Please enter a title for the content')
      return
    }
    
    if (!content.section_id || content.section_id === 0) {
      alert('Please select a section. You need to create a section first before adding content.')
      return
    }
    
    setIsSaving(true)
    try {
      const url = contentId ? `/api/content/${contentId}` : '/api/content'
      const method = contentId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(content)
      })

      if (response.ok) {
        const data = await response.json()
        setContent(data)
        alert('Content saved successfully!')
        if (onContentSaved) {
          onContentSaved()
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Error saving content: ${errorData.error || 'Please try again'}`)
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Error saving content')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contentId) return
    
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('Content deleted successfully!')
        resetForm()
        if (onContentSaved) {
          onContentSaved()
        }
      } else {
        alert('Error deleting content')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Error deleting content')
    }
  }

  // Auto-detect content type based on structure
  const detectContentType = (content: any): string | null => {
    if (!content || typeof content !== 'object') return null
    
    if (content.tabs && Array.isArray(content.tabs)) return 'tabs'
    if (content.steps && Array.isArray(content.steps)) return 'procedure'
    if (content.items && Array.isArray(content.items)) return 'list'
    if (content.questions && Array.isArray(content.questions)) return 'quiz'
    if (content.headers && content.rows) return 'grid'
    if (content.type && ['warning', 'success', 'danger'].includes(content.type)) return content.type
    if (content.title && content.message) return 'warning'
    
    return null
  }

  // Render content editor for a specific type
  const renderContentEditorForType = (contentData: any, type: string) => {
    const tempContent = { ...contentData, container_type: type }
    
    // Temporarily update the current content for rendering
    const originalContent = content
    const originalType = content.container_type
    
    // Create a temporary setter that doesn't actually update
    const tempSetContent = (newContent: any) => {
      setContent({ ...originalContent, ...newContent, container_type: originalType })
    }
    
    // Use the existing renderContentEditor logic
    switch (type) {
      case 'tabs':
        return renderTabsEditor(tempContent, tempSetContent)
      case 'procedure':
        return renderProcedureEditor(tempContent, tempSetContent)
      case 'list':
        return renderListEditor(tempContent, tempSetContent)
      case 'quiz':
        return renderQuizEditor(tempContent, tempSetContent)
      case 'grid':
        return renderGridEditor(tempContent, tempSetContent)
      case 'warning':
      case 'success':
      case 'danger':
        return renderAlertEditor(tempContent, tempSetContent)
      default:
        return renderTextEditor(tempContent, tempSetContent)
    }
  }

  // Individual editor components
  const renderTabsEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tabbed Content
      </label>
      <div className="space-y-4">
        {(contentData.content.tabs || []).map((tab: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex gap-2 mb-3 items-center">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded font-medium"
                placeholder="Tab title"
                value={tab.title || ''}
                onChange={(e) => {
                  const newTabs = [...(contentData.content.tabs || [])]
                  newTabs[index] = { ...tab, title: e.target.value }
                  setContentFunc({
                    ...contentData,
                    content: { ...contentData.content, tabs: newTabs }
                  })
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newTabs = [...(contentData.content.tabs || [])]
                  newTabs.splice(index, 1)
                  setContentFunc({
                    ...contentData,
                    content: { ...contentData.content, tabs: newTabs }
                  })
                }}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Delete tab"
              >
                ×
              </button>
            </div>
            <RichTextEditor
              value={typeof tab.content === 'string' ? tab.content : (tab.content?.text || '')}
              onChange={(value) => {
                const newTabs = [...(contentData.content.tabs || [])]
                newTabs[index] = { ...tab, content: value }
                setContentFunc({
                  ...contentData,
                  content: { ...contentData.content, tabs: newTabs }
                })
              }}
              placeholder="Enter tab content with formatting..."
              rows={6}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const newTabs = [...(contentData.content.tabs || []), { title: '', content: '' }]
            setContentFunc({
              ...contentData,
              content: { ...contentData.content, tabs: newTabs }
            })
          }}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add New Tab
        </button>
      </div>
    </div>
  )

  const renderTextEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Text Content
      </label>
      <RichTextEditor
        value={extractTextFromComplexContent(contentData.content) || ''}
        onChange={(value) => setContentFunc({
          ...contentData,
          content: { text: value }
        })}
        placeholder="Enter your content with formatting..."
        rows={8}
      />
    </div>
  )

  const renderProcedureEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Procedure Steps
      </label>
      <div className="space-y-3">
        {(contentData.content.steps || []).map((step: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded mb-2"
              placeholder="Step title"
              value={step.title || ''}
              onChange={(e) => {
                const newSteps = [...(contentData.content.steps || [])]
                newSteps[index] = { ...step, title: e.target.value }
                setContentFunc({
                  ...contentData,
                  content: { ...contentData.content, steps: newSteps }
                })
              }}
            />
            <textarea
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Step description"
              value={step.description || ''}
              onChange={(e) => {
                const newSteps = [...(contentData.content.steps || [])]
                newSteps[index] = { ...step, description: e.target.value }
                setContentFunc({
                  ...contentData,
                  content: { ...contentData.content, steps: newSteps }
                })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderListEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        List Items
      </label>
      <div className="space-y-2">
        {(contentData.content.items || []).map((item: string, index: number) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded"
              value={item}
              onChange={(e) => {
                const newItems = [...(contentData.content.items || [])]
                newItems[index] = e.target.value
                setContentFunc({
                  ...contentData,
                  content: { ...contentData.content, items: newItems }
                })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderQuizEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Quiz Questions
      </label>
      <input
        type="text"
        className="w-full p-3 border border-gray-300 rounded-lg font-medium mb-4"
        placeholder="Quiz title"
        value={contentData.content.title || ''}
        onChange={(e) => setContentFunc({
          ...contentData,
          content: { ...contentData.content, title: e.target.value }
        })}
      />
    </div>
  )

  const renderGridEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Data Grid
      </label>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        value={(contentData.content.headers || []).join(', ')}
        onChange={(e) => {
          const headers = e.target.value.split(',').map(h => h.trim()).filter(h => h)
          setContentFunc({
            ...contentData,
            content: { ...contentData.content, headers }
          })
        }}
        placeholder="Column 1, Column 2, Column 3"
      />
    </div>
  )

  const renderAlertEditor = (contentData: any, setContentFunc: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Alert Message
      </label>
      <input
        type="text"
        className="w-full p-3 border border-gray-300 rounded-lg mb-3"
        placeholder="Alert title"
        value={contentData.content.title || ''}
        onChange={(e) => setContentFunc({
          ...contentData,
          content: { ...contentData.content, title: e.target.value }
        })}
      />
      <textarea
        className="w-full p-3 border border-gray-300 rounded-lg"
        placeholder="Alert message"
        value={contentData.content.message || ''}
        onChange={(e) => setContentFunc({
          ...contentData,
          content: { ...contentData.content, message: e.target.value }
        })}
        rows={3}
      />
    </div>
  )

  const renderContentEditor = () => {
    switch (content.container_type) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <RichTextEditor
              value={content.content.text || ''}
              onChange={(value) => setContent({
                ...content,
                content: { ...content.content, text: value }
              })}
              placeholder="Enter your content with formatting..."
              rows={12}
            />
          </div>
        )
      
      case 'list':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              List Items
            </label>
            <div className="space-y-2">
              {(content.content.items || []).map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(content.content.items || [])]
                      newItems[index] = e.target.value
                      setContent({
                        ...content,
                        content: { ...content.content, items: newItems }
                      })
                    }}
                  />
                  <button
                    onClick={() => {
                      const newItems = [...(content.content.items || [])]
                      newItems.splice(index, 1)
                      setContent({
                        ...content,
                        content: { ...content.content, items: newItems }
                      })
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...(content.content.items || []), '']
                  setContent({
                    ...content,
                    content: { ...content.content, items: newItems }
                  })
                }}
                className="flex items-center gap-2 p-2 text-primary hover:bg-blue-50 rounded"
              >
                <PlusIcon size={16} />
                Add Item
              </button>
            </div>
          </div>
        )
      
      case 'procedure':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Procedure Steps
            </label>
            <div className="space-y-3">
              {(content.content.steps || []).map((step: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="w-16 p-2 border border-gray-300 rounded text-center"
                      placeholder="🏊"
                      value={step.icon || ''}
                      onChange={(e) => {
                        const newSteps = [...(content.content.steps || [])]
                        newSteps[index] = { ...step, icon: e.target.value }
                        setContent({
                          ...content,
                          content: { ...content.content, steps: newSteps }
                        })
                      }}
                    />
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded"
                      placeholder="Step title"
                      value={step.title || ''}
                      onChange={(e) => {
                        const newSteps = [...(content.content.steps || [])]
                        newSteps[index] = { ...step, title: e.target.value }
                        setContent({
                          ...content,
                          content: { ...content.content, steps: newSteps }
                        })
                      }}
                    />
                    <button
                      onClick={() => {
                        const newSteps = [...(content.content.steps || [])]
                        newSteps.splice(index, 1)
                        setContent({
                          ...content,
                          content: { ...content.content, steps: newSteps }
                        })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                  <RichTextEditor
                    value={step.description || ''}
                    onChange={(value) => {
                      const newSteps = [...(content.content.steps || [])]
                      newSteps[index] = { ...step, description: value }
                      setContent({
                        ...content,
                        content: { ...content.content, steps: newSteps }
                      })
                    }}
                    placeholder="Step description with formatting..."
                    rows={6}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newSteps = [...(content.content.steps || []), { icon: '', title: '', description: '' }]
                  setContent({
                    ...content,
                    content: { ...content.content, steps: newSteps }
                  })
                }}
                className="flex items-center gap-2 p-2 text-primary hover:bg-blue-50 rounded"
              >
                <PlusIcon size={16} />
                Add Step
              </button>
            </div>
          </div>
        )
      
      case 'tabs':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tabbed Content
            </label>
            <div className="space-y-4">
              {(content.content.tabs || []).map((tab: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded font-medium"
                      placeholder="Tab title"
                      value={tab.title || ''}
                      onChange={(e) => {
                        const newTabs = [...(content.content.tabs || [])]
                        newTabs[index] = { ...tab, title: e.target.value }
                        setContent({
                          ...content,
                          content: { ...content.content, tabs: newTabs }
                        })
                      }}
                    />
                    <button
                      onClick={() => {
                        const newTabs = [...(content.content.tabs || [])]
                        newTabs.splice(index, 1)
                        setContent({
                          ...content,
                          content: { ...content.content, tabs: newTabs }
                        })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                  <RichTextEditor
                    value={typeof tab.content === 'string' ? tab.content : (tab.content?.text || '')}
                    onChange={(value) => {
                      const newTabs = [...(content.content.tabs || [])]
                      newTabs[index] = { ...tab, content: value }
                      setContent({
                        ...content,
                        content: { ...content.content, tabs: newTabs }
                      })
                    }}
                    placeholder="Enter tab content with formatting..."
                    rows={10}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newTabs = [...(content.content.tabs || []), { title: '', content: '' }]
                  setContent({
                    ...content,
                    content: { ...content.content, tabs: newTabs }
                  })
                }}
                className="flex items-center gap-2 p-2 text-primary hover:bg-blue-50 rounded"
              >
                <PlusIcon size={16} />
                Add Tab
              </button>
            </div>
          </div>
        )

      case 'grid':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Grid
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Headers (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={(content.content.headers || []).join(', ')}
                  onChange={(e) => {
                    const headers = e.target.value.split(',').map(h => h.trim()).filter(h => h)
                    setContent({
                      ...content,
                      content: { ...content.content, headers }
                    })
                  }}
                  placeholder="Column 1, Column 2, Column 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Rows
                </label>
                <div className="space-y-2">
                  {(content.content.rows || []).map((row: any[], index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        value={Array.isArray(row) ? row.join(', ') : row}
                        onChange={(e) => {
                          const newRows = [...(content.content.rows || [])]
                          newRows[index] = e.target.value.split(',').map(v => v.trim())
                          setContent({
                            ...content,
                            content: { ...content.content, rows: newRows }
                          })
                        }}
                        placeholder="Value 1, Value 2, Value 3"
                      />
                      <button
                        onClick={() => {
                          const newRows = [...(content.content.rows || [])]
                          newRows.splice(index, 1)
                          setContent({
                            ...content,
                            content: { ...content.content, rows: newRows }
                          })
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newRows = [...(content.content.rows || []), ['']]
                      setContent({
                        ...content,
                        content: { ...content.content, rows: newRows }
                      })
                    }}
                    className="flex items-center gap-2 p-2 text-primary hover:bg-blue-50 rounded"
                  >
                    <PlusIcon size={16} />
                    Add Row
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Questions
            </label>
            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg font-medium"
                placeholder="Quiz title"
                value={content.content.title || ''}
                onChange={(e) => setContent({
                  ...content,
                  content: { ...content.content, title: e.target.value }
                })}
              />
              <div className="space-y-4">
                {(content.content.questions || []).map((question: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="Question"
                        value={question.question || ''}
                        onChange={(e) => {
                          const newQuestions = [...(content.content.questions || [])]
                          newQuestions[index] = { ...question, question: e.target.value }
                          setContent({
                            ...content,
                            content: { ...content.content, questions: newQuestions }
                          })
                        }}
                      />
                      <button
                        onClick={() => {
                          const newQuestions = [...(content.content.questions || [])]
                          newQuestions.splice(index, 1)
                          setContent({
                            ...content,
                            content: { ...content.content, questions: newQuestions }
                          })
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(question.options || []).map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 rounded text-sm"
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newQuestions = [...(content.content.questions || [])]
                              const newOptions = [...(question.options || [])]
                              newOptions[optIndex] = e.target.value
                              newQuestions[index] = { ...question, options: newOptions }
                              setContent({
                                ...content,
                                content: { ...content.content, questions: newQuestions }
                              })
                            }}
                          />
                          <button
                            onClick={() => {
                              const newQuestions = [...(content.content.questions || [])]
                              const newOptions = [...(question.options || [])]
                              newOptions.splice(optIndex, 1)
                              newQuestions[index] = { ...question, options: newOptions }
                              setContent({
                                ...content,
                                content: { ...content.content, questions: newQuestions }
                              })
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newQuestions = [...(content.content.questions || [])]
                          const newOptions = [...(question.options || []), '']
                          newQuestions[index] = { ...question, options: newOptions }
                          setContent({
                            ...content,
                            content: { ...content.content, questions: newQuestions }
                          })
                        }}
                        className="text-sm text-primary hover:bg-blue-50 p-1 rounded"
                      >
                        + Add Option
                      </button>
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-gray-600">Correct Answer:</label>
                      <select
                        className="ml-2 p-1 border border-gray-300 rounded text-sm"
                        value={question.correct || 0}
                        onChange={(e) => {
                          const newQuestions = [...(content.content.questions || [])]
                          newQuestions[index] = { ...question, correct: parseInt(e.target.value) }
                          setContent({
                            ...content,
                            content: { ...content.content, questions: newQuestions }
                          })
                        }}
                      >
                        {(question.options || []).map((option: string, optIndex: number) => (
                          <option key={optIndex} value={optIndex}>
                            Option {optIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newQuestions = [...(content.content.questions || []), {
                      question: '',
                      options: ['', ''],
                      correct: 0
                    }]
                    setContent({
                      ...content,
                      content: { ...content.content, questions: newQuestions }
                    })
                  }}
                  className="flex items-center gap-2 p-2 text-primary hover:bg-blue-50 rounded"
                >
                  <PlusIcon size={16} />
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )

      case 'warning':
      case 'success':
      case 'danger':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Message ({content.container_type})
            </label>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Alert title"
                value={content.content.title || ''}
                onChange={(e) => setContent({
                  ...content,
                  content: { ...content.content, title: e.target.value }
                })}
              />
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Alert message"
                value={content.content.message || ''}
                onChange={(e) => setContent({
                  ...content,
                  content: { ...content.content, message: e.target.value }
                })}
                rows={3}
              />
            </div>
          </div>
        )

      default:
        // Auto-detect content type for better editing
        const autoDetectedType = detectContentType(content.content)
        if (autoDetectedType && autoDetectedType !== content.container_type) {
          // Temporarily update the container type for better editing
          const tempContent = { ...content, container_type: autoDetectedType }
          return (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Auto-detected format:</strong> {autoDetectedType}. 
                  <button 
                    onClick={() => setContent({ ...content, container_type: autoDetectedType })}
                    className="ml-2 text-blue-600 underline hover:text-blue-800"
                  >
                    Switch to {autoDetectedType} editor
                  </button>
                </p>
              </div>
              {renderContentEditorForType(tempContent, autoDetectedType)}
            </div>
          )
        }
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Simple Text Content
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg h-40"
              value={
                typeof content.content === 'string' 
                  ? content.content 
                  : extractTextFromComplexContent(content.content) || ''
              }
              onChange={(e) => setContent({
                ...content,
                content: { text: e.target.value }
              })}
              placeholder="Enter your content here..."
            />
            <p className="text-sm text-gray-500 mt-2">
              This content will be displayed as simple text. Use the container type selector above to choose a different format.
            </p>
            {typeof content.content === 'object' && content.content !== null && Object.keys(content.content).length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  View original structure (for debugging)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(content.content, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">
          {contentId ? 'Edit Content' : 'Create New Content'}
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={content.title || ''}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              placeholder="Content title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emoji
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={content.emoji || ''}
              onChange={(e) => setContent({ ...content, emoji: e.target.value })}
              placeholder="🏊"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={content.description || ''}
            onChange={(e) => setContent({ ...content, description: e.target.value })}
            placeholder="Content description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            {sections.length === 0 ? (
              <div className="w-full p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                No sections available. Please create a section first in the Sections tab.
              </div>
            ) : (
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={content.section_id}
                onChange={(e) => setContent({ ...content, section_id: parseInt(e.target.value) })}
              >
                {sections.map((section: any) => (
                  <option key={section.id} value={section.id}>
                    {section.emoji} {section.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Container Type
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={content.container_type}
              onChange={(e) => setContent({ ...content, container_type: e.target.value, content: {} })}
            >
              {containerTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {renderContentEditor()}

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Additional Elements</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const alerts = currentContent.alerts || []
                alerts.push({ type: 'warning', title: '', message: '' })
                setContent({
                  ...content,
                  content: { ...currentContent, alerts }
                })
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Add Warning Box
            </button>
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const alerts = currentContent.alerts || []
                alerts.push({ type: 'danger', title: '', message: '' })
                setContent({
                  ...content,
                  content: { ...currentContent, alerts }
                })
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Add Danger Box
            </button>
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const alerts = currentContent.alerts || []
                alerts.push({ type: 'success', title: '', message: '' })
                setContent({
                  ...content,
                  content: { ...currentContent, alerts }
                })
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Success Box
            </button>
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const notes = currentContent.notes || []
                notes.push('')
                setContent({
                  ...content,
                  content: { ...currentContent, notes }
                })
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Note
            </button>
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const infoBoxes = currentContent.infoBoxes || []
                infoBoxes.push({ title: '', content: '' })
                setContent({
                  ...content,
                  content: { ...currentContent, infoBoxes }
                })
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Info Box
            </button>
            <button
              onClick={() => {
                const currentContent = content.content || {}
                const tips = currentContent.tips || []
                tips.push({ title: '', content: '' })
                setContent({
                  ...content,
                  content: { ...currentContent, tips }
                })
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Add Tip
            </button>
          </div>
          
          {/* Display and edit alerts */}
          {content.content?.alerts && content.content.alerts.length > 0 && (
            <div className="mt-4 space-y-4">
              <h4 className="text-md font-semibold text-gray-700">Alert Boxes</h4>
              {content.content.alerts.map((alert: any, index: number) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {alert.type === 'warning' ? '⚠️ Warning Box' : 
                       alert.type === 'danger' ? '🚨 Danger Box' : 
                       '✅ Success Box'}
                    </span>
                    <button
                      onClick={() => {
                        const currentContent = content.content || {}
                        const alerts = currentContent.alerts.filter((_: any, i: number) => i !== index)
                        setContent({
                          ...content,
                          content: { ...currentContent, alerts }
                        })
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-2"
                    placeholder="Alert title"
                    value={alert.title || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const alerts = [...currentContent.alerts]
                      alerts[index] = { ...alerts[index], title: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, alerts }
                      })
                    }}
                  />
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Alert message"
                    value={alert.message || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const alerts = [...currentContent.alerts]
                      alerts[index] = { ...alerts[index], message: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, alerts }
                      })
                    }}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Display and edit notes */}
          {content.content?.notes && content.content.notes.length > 0 && (
            <div className="mt-4 space-y-4">
              <h4 className="text-md font-semibold text-gray-700">Notes</h4>
              {content.content.notes.map((note: string, index: number) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">📝 Note {index + 1}</span>
                    <button
                      onClick={() => {
                        const currentContent = content.content || {}
                        const notes = currentContent.notes.filter((_: any, i: number) => i !== index)
                        setContent({
                          ...content,
                          content: { ...currentContent, notes }
                        })
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Note content"
                    value={note || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const notes = [...currentContent.notes]
                      notes[index] = e.target.value
                      setContent({
                        ...content,
                        content: { ...currentContent, notes }
                      })
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Display and edit info boxes */}
          {content.content?.infoBoxes && content.content.infoBoxes.length > 0 && (
            <div className="mt-4 space-y-4">
              <h4 className="text-md font-semibold text-gray-700">Info Boxes</h4>
              {content.content.infoBoxes.map((infoBox: any, index: number) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">ℹ️ Info Box {index + 1}</span>
                    <button
                      onClick={() => {
                        const currentContent = content.content || {}
                        const infoBoxes = currentContent.infoBoxes.filter((_: any, i: number) => i !== index)
                        setContent({
                          ...content,
                          content: { ...currentContent, infoBoxes }
                        })
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-2"
                    placeholder="Info box title"
                    value={infoBox.title || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const infoBoxes = [...currentContent.infoBoxes]
                      infoBoxes[index] = { ...infoBoxes[index], title: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, infoBoxes }
                      })
                    }}
                  />
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Info box content"
                    value={infoBox.content || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const infoBoxes = [...currentContent.infoBoxes]
                      infoBoxes[index] = { ...infoBoxes[index], content: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, infoBoxes }
                      })
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Display and edit tips */}
          {content.content?.tips && content.content.tips.length > 0 && (
            <div className="mt-4 space-y-4">
              <h4 className="text-md font-semibold text-gray-700">Tips</h4>
              {content.content.tips.map((tip: any, index: number) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">💡 Tip {index + 1}</span>
                    <button
                      onClick={() => {
                        const currentContent = content.content || {}
                        const tips = currentContent.tips.filter((_: any, i: number) => i !== index)
                        setContent({
                          ...content,
                          content: { ...currentContent, tips }
                        })
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-2"
                    placeholder="Tip title"
                    value={tip.title || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const tips = [...currentContent.tips]
                      tips[index] = { ...tips[index], title: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, tips }
                      })
                    }}
                  />
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Tip content"
                    value={tip.content || ''}
                    onChange={(e) => {
                      const currentContent = content.content || {}
                      const tips = [...currentContent.tips]
                      tips[index] = { ...tips[index], content: e.target.value }
                      setContent({
                        ...content,
                        content: { ...currentContent, tips }
                      })
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.published}
              onChange={(e) => setContent({ ...content, published: e.target.checked })}
            />
            <span className="text-sm font-medium text-gray-700">Published</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            <SaveIcon size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {contentId && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              <TrashIcon size={16} />
              Delete
            </button>
          )}

          <button
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
} 