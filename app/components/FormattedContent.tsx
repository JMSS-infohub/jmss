'use client'

interface FormattedContentProps {
  content: string
  className?: string
}

export default function FormattedContent({ content, className = "" }: FormattedContentProps) {
  // Convert markdown-like formatting to HTML
  const formatContent = (text: string) => {
    if (!text) return ''
    
    return text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Headings
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-3 text-gray-800 dark:text-gray-100">$1</h3>')
      // Bullet points
      .replace(/^• (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      // Numbered lists
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$2</li>')
      // Separators
      .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
      // Line breaks
      .replace(/\n/g, '<br>')
  }

  const formattedHTML = formatContent(content)

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHTML }}
    />
  )
} 