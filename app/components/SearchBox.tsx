'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchResult {
  type: string;
  id: number;
  title: string;
  content: string;
  section_name: string;
  emoji: string;
  url: string;
}

export default function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
        } catch (error) {
          console.error('Search error:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const handleResultClick = (url: string) => {
    window.location.href = url
    clearSearch()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search for topics, procedures, or keywords..."
          className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}-${index}`}
                  className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  onClick={() => handleResultClick(result.url)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-base sm:text-lg flex-shrink-0">{result.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(result.title, query) 
                          }} 
                        />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result.section_name} • {result.type === 'section' ? 'Section' : 'Content'}
                      </div>
                    </div>
                  </div>
                  {result.content && (
                    <div 
                      className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(result.content, query) 
                      }} 
                    />
                  )}
                </div>
              ))}
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
} 