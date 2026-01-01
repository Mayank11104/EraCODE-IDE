import { useState } from 'react'
import { 
  FolderTree,
  Search,
  GitBranch,
  Bug,
  Bot,
  Zap,
  Eye,
  Workflow,
  Container,
  Cloud,
  Activity,
  Plug,
  Database,
  Network,
  User,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface SidebarItem {
  id: string
  icon: any
  label: string
  color?: string
}

interface SidebarSection {
  id: string
  icon: any
  title: string
  color: string
  expanded: boolean
  items: SidebarItem[]
}

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('explorer')
  
  // Core items - always visible (no collapsing)
  const coreItems = [
    { id: 'explorer', icon: FolderTree, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Bug, label: 'Debug & Run' },
  ]

  // Collapsible sections
  const [sections, setSections] = useState<SidebarSection[]>([
    {
      id: 'ai',
      icon: Bot,
      title: 'AI',
      color: 'text-purple-400',
      expanded: false,
      items: [
        { id: 'agent', icon: Bot, label: 'AI Agent', color: 'text-purple-400' },
        { id: 'workflows', icon: Zap, label: 'Workflows', color: 'text-yellow-400' },
        { id: 'review', icon: Eye, label: 'Code Review', color: 'text-blue-400' },
      ]
    },
    {
      id: 'devops',
      icon: Workflow,
      title: 'DevOps',
      color: 'text-green-400',
      expanded: false,
      items: [
        { id: 'cicd', icon: Workflow, label: 'CI/CD', color: 'text-green-400' },
        { id: 'docker', icon: Container, label: 'Docker', color: 'text-cyan-400' },
        { id: 'deploy', icon: Cloud, label: 'Deploy', color: 'text-orange-400' },
        { id: 'monitoring', icon: Activity, label: 'Monitor', color: 'text-red-400' },
      ]
    },
    {
      id: 'tools',
      icon: Plug,
      title: 'Tools',
      color: 'text-pink-400',
      expanded: false,
      items: [
        { id: 'api', icon: Plug, label: 'API Tester', color: 'text-pink-400' },
        { id: 'database', icon: Database, label: 'Database', color: 'text-indigo-400' },
        { id: 'visualizer', icon: Network, label: 'Visualizer', color: 'text-teal-400' },
      ]
    },
  ])

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : { ...section, expanded: false } // Close others
    ))
  }

  return (
    <div className="w-12 bg-dark-base flex flex-col justify-between shrink-0 border-r border-dark-border overflow-y-auto hover:w-[200px] transition-all duration-200 group">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Core Items - Always Visible */}
        {coreItems.map((item) => {
          const isActive = activeItem === item.id
          const Icon = item.icon
          
          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all
                ${isActive 
                  ? 'text-white bg-dark-hover' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }
              `}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
              )}
              <Icon size={20} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="text-[13px] truncate opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </div>
          )
        })}

        {/* Separator */}
        <div className="w-8 h-[1px] bg-dark-border mx-auto my-2" />

        {/* Collapsible Sections */}
        {sections.map((section) => {
          const SectionIcon = section.icon
          
          return (
            <div key={section.id}>
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                className={`
                  relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all
                  hover:bg-white/5
                  ${section.color}
                `}
                title={section.title}
              >
                <SectionIcon size={20} strokeWidth={1.5} className="flex-shrink-0" />
                <div className="flex items-center justify-between flex-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[13px] font-semibold whitespace-nowrap">
                    {section.title}
                  </span>
                  {section.expanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </div>
              </div>

              {/* Section Items - Only show when expanded */}
              {section.expanded && (
                <div className="flex flex-col bg-dark-surface/50">
                  {section.items.map((item) => {
                    const isActive = activeItem === item.id
                    const ItemIcon = item.icon
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveItem(item.id)}
                        className={`
                          relative flex items-center gap-3 px-3 py-2 pl-6 cursor-pointer transition-all
                          ${isActive 
                            ? 'bg-dark-hover text-white' 
                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
                        )}
                        <ItemIcon 
                          size={16} 
                          strokeWidth={1.5} 
                          className={`flex-shrink-0 ${item.color || ''}`}
                        />
                        <span className="text-[12px] truncate opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Icons - Fixed */}
      <div className="flex flex-col border-t border-dark-border">
        <div
          onClick={() => setActiveItem('account')}
          className={`
            relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all
            ${activeItem === 'account' 
              ? 'bg-dark-hover text-white' 
              : 'text-text-secondary hover:bg-white/5 hover:text-white'
            }
          `}
          title="Account"
        >
          {activeItem === 'account' && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
          )}
          <User size={20} strokeWidth={1.5} className="flex-shrink-0" />
          <span className="text-[13px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Account
          </span>
        </div>
        
        <div
          onClick={() => setActiveItem('settings')}
          className={`
            relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all
            ${activeItem === 'settings' 
              ? 'bg-dark-hover text-white' 
              : 'text-text-secondary hover:bg-white/5 hover:text-white'
            }
          `}
          title="Settings"
        >
          {activeItem === 'settings' && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
          )}
          <Settings size={20} strokeWidth={1.5} className="flex-shrink-0" />
          <span className="text-[13px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Settings
          </span>
        </div>
      </div>
    </div>
  )
}
