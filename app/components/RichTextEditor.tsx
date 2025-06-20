'use client'

import { useRef, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content here...",
  className = "",
  rows = 12
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const formatBold = () => {
    document.execCommand('bold', false)
    handleInput()
  }

  const formatItalic = () => {
    document.execCommand('italic', false)
    handleInput()
  }

  const formatUnderline = () => {
    document.execCommand('underline', false)
    handleInput()
  }

  const insertBulletList = () => {
    document.execCommand('insertUnorderedList', false)
    handleInput()
  }

  const insertNumberedList = () => {
    document.execCommand('insertOrderedList', false)
    handleInput()
  }

  const formatHeading = () => {
    document.execCommand('formatBlock', false, 'h2')
    handleInput()
  }

  const insertHorizontalRule = () => {
    document.execCommand('insertHorizontalRule', false)
    handleInput()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatBold()
          break
        case 'i':
          e.preventDefault()
          formatItalic()
          break
        case 'u':
          e.preventDefault()
          formatUnderline()
          break
      }
    }
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={formatBold}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors font-bold text-sm border border-transparent hover:border-gray-300"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={formatItalic}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors italic text-sm border border-transparent hover:border-gray-300"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={formatUnderline}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors underline text-sm border border-transparent hover:border-gray-300"
            title="Underline (Ctrl+U)"
          >
            U
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertBulletList}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors text-sm border border-transparent hover:border-gray-300"
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={insertNumberedList}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors text-sm font-mono border border-transparent hover:border-gray-300"
            title="Numbered List"
          >
            1. List
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={formatHeading}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold border border-transparent hover:border-gray-300"
            title="Heading"
          >
            H2
          </button>
          <button
            type="button"
            onClick={insertHorizontalRule}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors text-sm border border-transparent hover:border-gray-300"
            title="Separator Line"
          >
            ——
          </button>
        </div>
      </div>

      {/* WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        className="w-full p-6 focus:outline-none bg-white rounded-b-lg prose prose-sm max-w-none"
        style={{ 
          minHeight: `${rows * 2.5}rem`,
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'inherit'
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
} 