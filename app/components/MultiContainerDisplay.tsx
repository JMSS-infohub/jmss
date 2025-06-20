'use client'

import { useState, useEffect } from 'react'
import FormattedContent from './FormattedContent'

interface ContainerInstance {
  id: number
  content_item_id: number
  container_type: string
  content: any
  order_index: number
}

interface MultiContainerDisplayProps {
  contentId: number
}

export default function MultiContainerDisplay({ contentId }: MultiContainerDisplayProps) {
  const [containers, setContainers] = useState<ContainerInstance[]>([])
  const [loading, setLoading] = useState(true)

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

  const renderContainer = (container: ContainerInstance) => {
    const { container_type, content } = container

    switch (container_type) {
      case 'text':
        return (
          <div key={container.id} className="mb-6">
            <FormattedContent content={content.text || ''} />
          </div>
        )

      case 'danger':
        return (
          <div key={container.id} className="mb-6">
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
              {content.title && (
                <h4 className="text-red-700 font-semibold mb-2">{content.title}</h4>
              )}
              {content.message && (
                <p className="text-red-800">{content.message}</p>
              )}
            </div>
          </div>
        )

      case 'warning':
        return (
          <div key={container.id} className="mb-6">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
              {content.title && (
                <h4 className="text-yellow-700 font-semibold mb-2">{content.title}</h4>
              )}
              {content.message && (
                <p className="text-yellow-800">{content.message}</p>
              )}
            </div>
          </div>
        )

      case 'success':
        return (
          <div key={container.id} className="mb-6">
            <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
              {content.title && (
                <h4 className="text-green-700 font-semibold mb-2">{content.title}</h4>
              )}
              {content.message && (
                <p className="text-green-800">{content.message}</p>
              )}
            </div>
          </div>
        )

      case 'grid':
        return (
          <div key={container.id} className="mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                {content.headers && content.headers.length > 0 && (
                  <thead>
                    <tr>
                      {content.headers.map((header: string, index: number) => (
                        <th key={index} className="px-4 py-2 border-b border-gray-300 bg-gray-50 text-left font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                {content.rows && content.rows.length > 0 && (
                  <tbody>
                    {content.rows.map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="px-4 py-2 border-b border-gray-200">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        )

      case 'list':
        return (
          <div key={container.id} className="mb-6">
            <ul className="list-disc list-inside space-y-2">
              {content.items && content.items.map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        )

      case 'procedure':
        return (
          <div key={container.id} className="mb-6">
            <ol className="space-y-4">
              {content.steps && content.steps.map((step: any, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{step.icon || '📝'}</span>
                  <div>
                    {step.title && (
                      <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                    )}
                    {step.description && (
                      <p className="text-gray-700">{step.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )

      case 'tabs':
        return (
          <div key={container.id} className="mb-6">
            <TabContainer content={content} />
          </div>
        )

      case 'quiz':
        return (
          <div key={container.id} className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {content.title && (
                <h4 className="text-blue-900 font-semibold mb-3">{content.title}</h4>
              )}
              {content.questions && content.questions.map((question: any, index: number) => (
                <div key={index} className="mb-4">
                  <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                  <div className="space-y-2">
                    {question.options && question.options.map((option: string, optionIndex: number) => (
                      <label key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={optionIndex}
                          className="text-blue-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div key={container.id} className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
            <p className="text-gray-600">
              Unknown container type: {container_type}
            </p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading containers...</div>
  }

  if (containers.length === 0) {
    return <div className="p-4 text-center text-gray-500">No containers found.</div>
  }

  return (
    <div className="space-y-6">
      {containers
        .sort((a, b) => a.order_index - b.order_index)
        .map(renderContainer)
      }
    </div>
  )
}

// TabContainer component (copied from section page)
function TabContainer({ content }: { content: any }) {
  const [activeTab, setActiveTab] = useState(0)
  
  if (!content.tabs || !Array.isArray(content.tabs) || content.tabs.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">No tabs data available.</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-300">
        {content.tabs.map((tab: any, index: number) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.title || `Tab ${index + 1}`}
          </button>
        ))}
      </div>
      <div className="p-4">
        {content.tabs[activeTab] && (
          <FormattedContent content={content.tabs[activeTab].content || ''} />
        )}
      </div>
    </div>
  )
} 