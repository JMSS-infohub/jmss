'use client'

import { useState, useEffect } from 'react'

interface Module {
  id: number
  name: string
  description: string
  emoji: string
  categoryCount: number
}

export default function ModuleGrid() {
  const [modules, setModules] = useState<Module[]>([])

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections')
      if (response.ok) {
        const sections = await response.json()
        const modulesData = sections.map((section: any) => ({
          id: section.id,
          name: section.name,
          description: section.description,
          emoji: section.emoji,
          categoryCount: section.content_count || 0
        }))
        setModules(modulesData)
      } else {
        // Fallback to default modules if API fails
        const defaultModules: Module[] = [
          { id: 1, name: 'Swim Programs', description: 'All class offerings by age group', emoji: '🏊', categoryCount: 4 },
          { id: 2, name: 'Front Desk Procedures', description: 'Daily tasks and operations', emoji: '🏢', categoryCount: 4 },
          { id: 3, name: 'iClassPro System', description: 'Enrollments, reports, and management', emoji: '💻', categoryCount: 4 },
          { id: 4, name: 'Pool Information', description: 'Temps, Dimensions, Levels, Lanes', emoji: '🏊‍♀️', categoryCount: 4 },
          { id: 5, name: 'Level Progression', description: 'Who goes to what', emoji: '📈', categoryCount: 4 },
          { id: 6, name: 'Age Up Guidelines', description: 'Who goes to what after aging up', emoji: '🎂', categoryCount: 4 },
          { id: 7, name: 'Emergency Procedures', description: 'Safety protocols and incident response', emoji: '🚨', categoryCount: 2 },
          { id: 8, name: 'Policies & Forms', description: 'Waivers, cancellations, and procedures', emoji: '📋', categoryCount: 3 },
          { id: 9, name: 'First Day Bags', description: 'Contents and distribution procedures', emoji: '🎒', categoryCount: 1 },
          { id: 10, name: 'Tuition Prices', description: 'Current pricing information', emoji: '💰', categoryCount: 1 },
          { id: 11, name: 'Google Drive Links', description: 'Quick access to important documents', emoji: '📁', categoryCount: 4 }
        ]
        setModules(defaultModules)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const handleModuleClick = (module: Module) => {
    // Convert module name to slug for URL
    const slug = module.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
    window.location.href = `/${slug}`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {modules.map((module) => (
        <div
          key={module.id}
          className="module bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-accent"
          onClick={() => handleModuleClick(module)}
        >
          <div className="flex items-center mb-4">
            <span className="text-xl sm:text-2xl mr-3">{module.emoji}</span>
            <h2 className="text-lg sm:text-xl font-semibold text-accent dark:text-blue-400">{module.name}</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">{module.description}</p>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
            <div className="h-full bg-success rounded-full w-0"></div>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span>{module.categoryCount} categories</span>
          </div>
        </div>
      ))}
    </div>
  )
} 