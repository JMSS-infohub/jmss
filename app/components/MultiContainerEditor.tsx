'use client'

import { useState, useEffect } from 'react'
import RichTextEditor from './RichTextEditor'
import { Plus, Trash2, MoveUp, MoveDown, Edit } from 'lucide-react'

interface ContainerInstance {
  id?: number
  content_item_id: number
  container_type: string
  content: any
  order_index: number
}

interface MultiContainerEditorProps {
  contentId: number
  onContainersSaved?: () => void
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

export default function MultiContainerEditor({ contentId, onContainersSaved }: MultiContainerEditorProps) {
  const [containers, setContainers] = useState<ContainerInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingContainer, setEditingContainer] = useState<number | null>(null)

  useEffect(() => {
    loadContainers()
  }, [contentId])

  const loadContainers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/content/${contentId}/containers`)
      if (response.ok) {
        const data = await response.json()
        setContainers(data)
      } else {
        console.error('Failed to load containers')
      }
    } catch (error) {
      console.error('Error loading containers:', error)
    } finally {
      setLoading(false)
    }
  }

  const addContainer = () => {
    const newContainer: ContainerInstance = {
      content_item_id: contentId,
      container_type: 'text',
      content: { text: '' },
      order_index: containers.length
    }
    setContainers([...containers, newContainer])
    setEditingContainer(containers.length)
  }

  const updateContainer = (index: number, updates: Partial<ContainerInstance>) => {
    const updatedContainers = [...containers]
    updatedContainers[index] = { ...updatedContainers[index], ...updates }
    setContainers(updatedContainers)
  }

  const deleteContainer = async (index: number) => {
    const container = containers[index]
    if (!container.id) {
      // Remove from local state if not saved yet
      const updatedContainers = containers.filter((_, i) => i !== index)
      setContainers(updatedContainers)
      return
    }

    try {
      const response = await fetch(`/api/content/${contentId}/containers/${container.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const updatedContainers = containers.filter((_, i) => i !== index)
        setContainers(updatedContainers)
      } else {
        alert('Error deleting container')
      }
    } catch (error) {
      console.error('Error deleting container:', error)
      alert('Error deleting container')
    }
  }

  const moveContainer = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === containers.length - 1) return

    const updatedContainers = [...containers]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap containers using temporary variable
    const temp = updatedContainers[index]
    updatedContainers[index] = updatedContainers[newIndex]
    updatedContainers[newIndex] = temp
    
    // Update order_index
    updatedContainers.forEach((container, i) => {
      container.order_index = i
    })
    
    setContainers(updatedContainers)
  }

  const saveContainer = async (index: number) => {
    const container = containers[index]
    setSaving(true)

    try {
      let response
      if (container.id) {
        // Update existing container
        response = await fetch(`/api/content/${contentId}/containers/${container.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(container)
        })
      } else {
        // Create new container
        response = await fetch(`/api/content/${contentId}/containers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(container)
        })
      }

      if (response.ok) {
        const savedContainer = await response.json()
        const updatedContainers = [...containers]
        updatedContainers[index] = savedContainer
        setContainers(updatedContainers)
        setEditingContainer(null)
        
        if (onContainersSaved) {
          onContainersSaved()
        }
      } else {
        alert('Error saving container')
      }
    } catch (error) {
      console.error('Error saving container:', error)
      alert('Error saving container')
    } finally {
      setSaving(false)
    }
  }

  const renderContainerEditor = (container: ContainerInstance, index: number) => {
    const isEditing = editingContainer === index

    if (!isEditing) {
      return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {containerTypes.find(t => t.type === container.container_type)?.name || container.container_type}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingContainer(index)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => deleteContainer(index)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {container.container_type === 'text' && container.content?.text && (
              <div className="line-clamp-2">{container.content.text}</div>
            )}
            {container.container_type === 'danger' && (
              <div className="text-red-600">⚠️ {container.content?.title || 'Danger Alert'}</div>
            )}
            {container.container_type === 'grid' && (
              <div className="text-gray-600">📊 Data Grid ({container.content?.headers?.length || 0} columns)</div>
            )}
            {/* Add more preview types as needed */}
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <select
            className="p-2 border border-gray-300 rounded"
            value={container.container_type}
            onChange={(e) => updateContainer(index, { 
              container_type: e.target.value, 
              content: getDefaultContent(e.target.value) 
            })}
          >
            {containerTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => saveContainer(index)}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditingContainer(null)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>

        {renderContentEditor(container, index)}
      </div>
    )
  }

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: '' }
      case 'list':
        return { items: [''] }
      case 'procedure':
        return { steps: [{ icon: '📝', title: '', description: '' }] }
      case 'warning':
      case 'success':
      case 'danger':
        return { title: '', message: '' }
      case 'quiz':
        return { title: '', questions: [{ question: '', options: ['', ''], correct: 0 }] }
      case 'grid':
        return { headers: ['Column 1', 'Column 2'], rows: [['', '']] }
      case 'tabs':
        return { tabs: [{ title: 'Tab 1', content: '' }] }
      default:
        return {}
    }
  }

  const renderContentEditor = (container: ContainerInstance, index: number) => {
    switch (container.container_type) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <RichTextEditor
              value={container.content.text || ''}
              onChange={(value) => updateContainer(index, {
                content: { ...container.content, text: value }
              })}
              placeholder="Enter your content with formatting..."
              rows={8}
            />
          </div>
        )

      case 'danger':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danger Alert
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg mb-3"
              placeholder="Alert title"
              value={container.content.title || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, title: e.target.value }
              })}
            />
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Alert message"
              value={container.content.message || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, message: e.target.value }
              })}
              rows={3}
            />
          </div>
        )

      case 'warning':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Alert
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg mb-3"
              placeholder="Warning title"
              value={container.content.title || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, title: e.target.value }
              })}
            />
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Warning message"
              value={container.content.message || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, message: e.target.value }
              })}
              rows={3}
            />
          </div>
        )

      case 'success':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Alert
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg mb-3"
              placeholder="Success title"
              value={container.content.title || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, title: e.target.value }
              })}
            />
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Success message"
              value={container.content.message || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, message: e.target.value }
              })}
              rows={3}
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
              {(container.content.items || ['']).map((item: string, itemIndex: number) => (
                <div key={itemIndex} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(container.content.items || [''])];
                      newItems[itemIndex] = e.target.value;
                      updateContainer(index, {
                        content: { ...container.content, items: newItems }
                      });
                    }}
                    placeholder={`List item ${itemIndex + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newItems = (container.content.items || ['']).filter((_, i) => i !== itemIndex);
                      updateContainer(index, {
                        content: { ...container.content, items: newItems }
                      });
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...(container.content.items || ['']), ''];
                  updateContainer(index, {
                    content: { ...container.content, items: newItems }
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
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
            <div className="space-y-4">
              {(container.content.steps || [{ icon: '📝', title: '', description: '' }]).map((step: any, stepIndex: number) => (
                <div key={stepIndex} className="p-4 border border-gray-300 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      className="p-2 border border-gray-300 rounded"
                      value={step.icon || ''}
                      onChange={(e) => {
                        const newSteps = [...(container.content.steps || [])];
                        newSteps[stepIndex] = { ...newSteps[stepIndex], icon: e.target.value };
                        updateContainer(index, {
                          content: { ...container.content, steps: newSteps }
                        });
                      }}
                      placeholder="Icon (emoji)"
                    />
                    <input
                      type="text"
                      className="p-2 border border-gray-300 rounded"
                      value={step.title || ''}
                      onChange={(e) => {
                        const newSteps = [...(container.content.steps || [])];
                        newSteps[stepIndex] = { ...newSteps[stepIndex], title: e.target.value };
                        updateContainer(index, {
                          content: { ...container.content, steps: newSteps }
                        });
                      }}
                      placeholder="Step title"
                    />
                    <button
                      onClick={() => {
                        const newSteps = (container.content.steps || []).filter((_, i) => i !== stepIndex);
                        updateContainer(index, {
                          content: { ...container.content, steps: newSteps }
                        });
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded mt-3"
                    value={step.description || ''}
                    onChange={(e) => {
                      const newSteps = [...(container.content.steps || [])];
                      newSteps[stepIndex] = { ...newSteps[stepIndex], description: e.target.value };
                      updateContainer(index, {
                        content: { ...container.content, steps: newSteps }
                      });
                    }}
                    placeholder="Step description"
                    rows={2}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newSteps = [...(container.content.steps || []), { icon: '📝', title: '', description: '' }];
                  updateContainer(index, {
                    content: { ...container.content, steps: newSteps }
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Step
              </button>
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Quiz title"
              value={container.content.title || ''}
              onChange={(e) => updateContainer(index, {
                content: { ...container.content, title: e.target.value }
              })}
            />
            <div className="space-y-4">
              {(container.content.questions || [{ question: '', options: ['', ''], correct: 0 }]).map((question: any, questionIndex: number) => (
                <div key={questionIndex} className="p-4 border border-gray-300 rounded-lg">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    value={question.question || ''}
                    onChange={(e) => {
                      const newQuestions = [...(container.content.questions || [])];
                      newQuestions[questionIndex] = { ...newQuestions[questionIndex], question: e.target.value };
                      updateContainer(index, {
                        content: { ...container.content, questions: newQuestions }
                      });
                    }}
                    placeholder="Question"
                  />
                  <div className="space-y-2">
                    {(question.options || ['', '']).map((option: string, optionIndex: number) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          checked={question.correct === optionIndex}
                          onChange={() => {
                            const newQuestions = [...(container.content.questions || [])];
                            newQuestions[questionIndex] = { ...newQuestions[questionIndex], correct: optionIndex };
                            updateContainer(index, {
                              content: { ...container.content, questions: newQuestions }
                            });
                          }}
                        />
                        <input
                          type="text"
                          className="flex-1 p-2 border border-gray-300 rounded"
                          value={option}
                          onChange={(e) => {
                            const newQuestions = [...(container.content.questions || [])];
                            const newOptions = [...(newQuestions[questionIndex].options || [])];
                            newOptions[optionIndex] = e.target.value;
                            newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
                            updateContainer(index, {
                              content: { ...container.content, questions: newQuestions }
                            });
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <button
                          onClick={() => {
                            const newQuestions = [...(container.content.questions || [])];
                            const newOptions = (newQuestions[questionIndex].options || []).filter((_, i) => i !== optionIndex);
                            newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
                            updateContainer(index, {
                              content: { ...container.content, questions: newQuestions }
                            });
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newQuestions = [...(container.content.questions || [])];
                        const newOptions = [...(newQuestions[questionIndex].options || []), ''];
                        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
                        updateContainer(index, {
                          content: { ...container.content, questions: newQuestions }
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Option
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const newQuestions = (container.content.questions || []).filter((_, i) => i !== questionIndex);
                      updateContainer(index, {
                        content: { ...container.content, questions: newQuestions }
                      });
                    }}
                    className="mt-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove Question
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newQuestions = [...(container.content.questions || []), { question: '', options: ['', ''], correct: 0 }];
                  updateContainer(index, {
                    content: { ...container.content, questions: newQuestions }
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Question
              </button>
            </div>
          </div>
        )

      case 'tabs':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tab Container
            </label>
            <div className="space-y-4">
              {(container.content.tabs || [{ title: 'Tab 1', content: '' }]).map((tab: any, tabIndex: number) => (
                <div key={tabIndex} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded"
                      value={tab.title || ''}
                      onChange={(e) => {
                        const newTabs = [...(container.content.tabs || [])];
                        newTabs[tabIndex] = { ...newTabs[tabIndex], title: e.target.value };
                        updateContainer(index, {
                          content: { ...container.content, tabs: newTabs }
                        });
                      }}
                      placeholder="Tab title"
                    />
                    <button
                      onClick={() => {
                        const newTabs = (container.content.tabs || []).filter((_, i) => i !== tabIndex);
                        updateContainer(index, {
                          content: { ...container.content, tabs: newTabs }
                        });
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <RichTextEditor
                    value={tab.content || ''}
                    onChange={(value) => {
                      const newTabs = [...(container.content.tabs || [])];
                      newTabs[tabIndex] = { ...newTabs[tabIndex], content: value };
                      updateContainer(index, {
                        content: { ...container.content, tabs: newTabs }
                      });
                    }}
                    placeholder="Tab content..."
                    rows={6}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newTabs = [...(container.content.tabs || []), { title: `Tab ${(container.content.tabs || []).length + 1}`, content: '' }];
                  updateContainer(index, {
                    content: { ...container.content, tabs: newTabs }
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
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
                  value={(container.content.headers || []).join(', ')}
                  onChange={(e) => {
                    const headers = e.target.value.split(',').map(h => h.trim()).filter(h => h);
                    updateContainer(index, {
                      content: { ...container.content, headers }
                    });
                  }}
                  placeholder="Column 1, Column 2, Column 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Rows (one per line, comma-separated values)
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded"
                  value={(container.content.rows || []).map(row => Array.isArray(row) ? row.join(', ') : row).join('\n')}
                  onChange={(e) => {
                    const rows = e.target.value.split('\n').map(line => 
                      line.split(',').map(cell => cell.trim()).filter(cell => cell)
                    ).filter(row => row.length > 0);
                    updateContainer(index, {
                      content: { ...container.content, rows }
                    });
                  }}
                  placeholder="Row 1, Value 1, Value 2&#10;Row 2, Value 1, Value 2"
                  rows={6}
                />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-yellow-800">
              Editor for {container.container_type} type not implemented yet.
            </p>
          </div>
        )
    }
  }

  if (loading) {
    return <div className="p-4">Loading containers...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Containers</h3>
        <button
          onClick={addContainer}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={16} />
          Add Container
        </button>
      </div>

      {containers.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>No containers yet. Click "Add Container" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {containers.map((container, index) => (
            <div key={container.id || index} className="relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
                <button
                  onClick={() => moveContainer(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  <MoveUp size={16} />
                </button>
                <button
                  onClick={() => moveContainer(index, 'down')}
                  disabled={index === containers.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  <MoveDown size={16} />
                </button>
              </div>
              <div className="ml-8">
                {renderContainerEditor(container, index)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 