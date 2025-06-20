'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../components/Header'
import FormattedContent from '../components/FormattedContent'
import MultiContainerDisplay from '../components/MultiContainerDisplay'
import { ArrowLeft } from 'lucide-react'

interface ContentItem {
  id: number
  title: string
  description: string
  content: any
  container_type: string
}

interface Section {
  id: number
  name: string
  description: string
  emoji: string
}

interface TabContainerProps {
  content: any
}

function TabContainer({ content }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(0)
  
  // Debug the content structure
  console.log('TabContainer received content:', content)
  console.log('Content tabs:', content.tabs)
  console.log('Content tabs type:', typeof content.tabs)
  console.log('Content tabs length:', content.tabs?.length)
  console.log('Tabs data:', JSON.stringify(content.tabs, null, 2))
  
  if (content.tabs) {
    content.tabs.forEach((tab: any, index: number) => {
      console.log(`Tab ${index + 1}:`, {
        title: tab.title,
        content: tab.content,
        contentType: typeof tab.content,
        contentValue: JSON.stringify(tab.content)
      })
    })
  }
  
  // Force component to notice when tabs data is missing
  if (!content.tabs || !Array.isArray(content.tabs) || content.tabs.length === 0) {
    console.log('WARNING: No valid tabs data found!')
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">
          <strong>Debug:</strong> No tabs data available. 
          Content structure: {JSON.stringify(content, null, 2)}
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {content.tabs.map((tab: any, index: number) => (
            <button
              key={`tab-header-${index}`}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === index
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.title || `Tab ${index + 1}`}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Active Tab Content */}
      {content.tabs[activeTab] && (
        <div className="p-4 bg-white rounded-lg border">
          <FormattedContent 
            content={content.tabs[activeTab].content || 'No content available'}
            className="text-gray-700"
          />
        </div>
      )}
      
      {/* Debug Info */}
      <div className="text-xs text-gray-400 border-t pt-2 mt-4">
        Debug: Active tab {activeTab + 1} of {content.tabs.length} | 
        Content: {JSON.stringify(content.tabs[activeTab]?.content).substring(0, 50)}...
      </div>
    </div>
  )
}

export default function SectionPage() {
  const params = useParams()
  const router = useRouter()
  const [section, setSection] = useState<Section | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const sectionSlug = params.section as string

  useEffect(() => {
    if (sectionSlug) {
      fetchSectionData()
    }
  }, [sectionSlug, lastRefresh])

  // Auto-refresh content every 60 seconds when on the page
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setLastRefresh(Date.now())
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [loading])

  const fetchSectionData = async () => {
    try {
      setLoading(true)
      
      // Convert slug back to section name
      const sectionName = sectionSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Add cache busting timestamp
      const timestamp = Date.now()

      // Fetch sections to find the right one
      const sectionsResponse = await fetch(`/api/sections?t=${timestamp}`)
      if (!sectionsResponse.ok) throw new Error('Failed to fetch sections')
      
      const sections = await sectionsResponse.json()
      console.log('All sections:', sections)
      console.log('Looking for section slug:', sectionSlug)
      console.log('Converted section name:', sectionName)
      
      const matchedSection = sections.find((s: Section) => 
        s.name.toLowerCase().replace(/\s+/g, '-') === sectionSlug ||
        s.name.toLowerCase() === sectionName.toLowerCase()
      )

      console.log('Matched section:', matchedSection)

      if (!matchedSection) {
        setError('Section not found')
        return
      }

      setSection(matchedSection)

      // Fetch content items for this section with cache busting
      const contentResponse = await fetch(`/api/sections/${matchedSection.id}/content?t=${timestamp}`)
      if (contentResponse.ok) {
        const content = await contentResponse.json()
        console.log(`Fetched ${content.length} content items for section ${matchedSection.name}:`, content)
        console.log('Content data:', content)
        
        // Debug individual content items
        content.forEach((item: any, index: number) => {
          console.log(`Content item ${index + 1}:`, {
            id: item.id,
            title: item.title,
            container_type: item.container_type,
            content: item.content,
            contentType: typeof item.content,
            contentKeys: item.content ? Object.keys(item.content) : 'no content'
          })
        })
        
        setContentItems(content)
      } else {
        console.error('Failed to fetch content, status:', contentResponse.status)
        setContentItems([])
      }
    } catch (err) {
      console.error('Error fetching section data:', err)
      setError('Failed to load section')
    } finally {
      setLoading(false)
    }
  }

  // Manual refresh function
  const handleRefresh = () => {
    console.log('Manual refresh triggered')
    setLastRefresh(Date.now())
  }

  const renderContent = (item: ContentItem) => {
    const content = item.content

    // Check if this content item has multiple containers
    // For now, we'll use a simple check - if the content is empty or minimal, 
    // it might have multiple containers
    const shouldUseMultipleContainers = !content || 
      (typeof content === 'object' && Object.keys(content).length === 0) ||
      (typeof content === 'object' && content.text === '' && !content.headers && !content.items)

    if (shouldUseMultipleContainers) {
      return <MultiContainerDisplay contentId={item.id} />
    }

    // Render alerts if they exist
    const renderAlerts = () => {
      if (!content.alerts || !Array.isArray(content.alerts)) return null
      
      return (
        <div className="space-y-4 mb-6">
          {content.alerts.map((alert: any, index: number) => {
            const alertStyles: { [key: string]: string } = {
              warning: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800',
              danger: 'bg-red-100 border-l-4 border-red-500 text-red-800',
              success: 'bg-green-100 border-l-4 border-green-500 text-green-800'
            }
            
            const alertType = alert.type && typeof alert.type === 'string' ? alert.type : 'warning'
            
            return (
              <div key={index} className={`p-4 rounded ${alertStyles[alertType] || alertStyles.warning}`}>
                {alert.title && (
                  <h4 className="font-semibold mb-2">{alert.title}</h4>
                )}
                {alert.message && (
                  <p>{alert.message}</p>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    // Render additional elements
    const renderAdditionalElements = () => {
      const elements: any[] = [] // Array of React JSX elements
      
      // Notes
      if (content.notes && Array.isArray(content.notes)) {
        content.notes.forEach((note: string, index: number) => {
          if (note && note.trim()) {
            elements.push(
              <div key={`note-${index}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                <p className="text-blue-800"><strong>Note:</strong> {note}</p>
              </div>
            )
          }
        })
      }
      
      // Info Boxes
      if (content.infoBoxes && Array.isArray(content.infoBoxes)) {
        content.infoBoxes.forEach((infoBox: any, index: number) => {
          if (infoBox.title || infoBox.content) {
            elements.push(
              <div key={`infobox-${index}`} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-4">
                {infoBox.title && (
                  <h4 className="font-semibold text-purple-800 mb-2">{infoBox.title}</h4>
                )}
                {infoBox.content && (
                  <p className="text-purple-700">{infoBox.content}</p>
                )}
              </div>
            )
          }
        })
      }
      
      // Tips
      if (content.tips && Array.isArray(content.tips)) {
        content.tips.forEach((tip: any, index: number) => {
          if (tip.title || tip.content) {
            elements.push(
              <div key={`tip-${index}`} className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded mb-4">
                {tip.title && (
                  <h4 className="font-semibold text-teal-800 mb-2">💡 {tip.title}</h4>
                )}
                {tip.content && (
                  <p className="text-teal-700">{tip.content}</p>
                )}
              </div>
            )
          }
        })
      }
      
      return elements.length > 0 ? (
        <div className="mt-6 space-y-4">
          {elements}
        </div>
      ) : null
    }

    const mainContent = (() => {
      switch (item.container_type) {
        case 'procedure':
          return (
            <div className="space-y-3">
              {content.items?.map((procedureItem: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-xl">{procedureItem.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{procedureItem.title}</h4>
                    {procedureItem.description && (
                      <p className="text-gray-600 mt-1">{procedureItem.description}</p>
                    )}
                    {procedureItem.price && (
                      <p className="text-primary font-medium mt-1">{procedureItem.price}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )

        case 'list':
          return (
            <ul className="space-y-2">
              {content.items?.map((item: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
          )

        case 'grid':
          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {content.headers?.map((header: string, index: number) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {content.rows?.map((row: string[] | string, rowIndex: number) => {
                    // Handle both old format (single string) and new format (array)
                    let cells: string[]
                    if (typeof row === 'string') {
                      // Split by comma if it's a string
                      cells = row.split(',').map(cell => cell.trim())
                    } else if (Array.isArray(row)) {
                      // If it's already an array, check if it's a single string that needs splitting
                      if (row.length === 1 && typeof row[0] === 'string' && row[0].includes(',')) {
                        cells = row[0].split(',').map(cell => cell.trim())
                      } else {
                        cells = row
                      }
                    } else {
                      cells = [String(row)]
                    }
                    
                    return (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {cells.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )

        case 'tabs':
          return (
            <TabContainer key={`tabs-${lastRefresh}`} content={content} />
          )

        case 'danger':
          return (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
              {content.warning && (
                <p className="text-red-700 font-semibold mb-4">{content.warning}</p>
              )}
              {content.contacts && (
                <div className="space-y-2">
                  {content.contacts.map((contact: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-lg">{contact.icon}</span>
                      <span className="text-red-800">{contact.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )

        case 'text':
        default:
          return (
            <div className="prose max-w-none">
              {content.text ? (
                <FormattedContent content={content.text} />
              ) : content.sections?.length > 0 ? (
                content.sections.map((section: any, index: number) => (
                  <div key={index} className="mb-4">
                    <h4 className="text-lg font-semibold">{section.title}</h4>
                    <p className="text-gray-600">{section.progression}</p>
                    {section.advanced && <p className="text-gray-600 mt-2">Advanced: {section.advanced}</p>}
                    {section.alternate && <p className="text-gray-600 mt-2">Alternate: {section.alternate}</p>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
              {content.note && (
                <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mt-4">
                  <p className="text-blue-700">{content.note}</p>
                </div>
              )}
            </div>
          )
      }
    })()

    return (
      <div>
        {renderAlerts()}
        {mainContent}
        {renderAdditionalElements()}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-xl text-gray-900 dark:text-white">Section not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-primary dark:text-blue-400 hover:text-primary/80 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Modules
          </button>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{section.emoji}</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{section.name}</h1>
          </div>
          {section.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">{section.description}</p>
          )}
        </div>

        <div className="space-y-8">
          {contentItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No content available for this section yet.</p>
              <button
                onClick={handleRefresh}
                className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                🔄 Check for Updates
              </button>
            </div>
          ) : (
            contentItems.map((item) => (
              <div key={`${item.id}-${lastRefresh}`} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
                  {item.description && (
                    <p className="text-gray-600 mb-4">{item.description}</p>
                  )}
                  <div className="mt-4">
                    {renderContent(item)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 