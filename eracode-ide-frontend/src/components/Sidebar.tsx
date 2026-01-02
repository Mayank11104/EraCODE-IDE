import { useState } from 'react'
import { 
  FolderTree,
  Search,
  GitBranch,
  Bug,
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


interface SidebarProps {
  onItemClick: (itemId: string) => void
  activeItem: string
  onHoverChange?: (isHovered: boolean) => void  // ✅ NEW
}


export default function Sidebar({ onItemClick, activeItem, onHoverChange }: SidebarProps) {
  // Core items - always visible (NO AI)
  const coreItems = [
    { id: 'explorer', icon: FolderTree, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Bug, label: 'Debug & Run' },
  ]


  // Collapsible sections
  const [sections, setSections] = useState<SidebarSection[]>([
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
        : section
    ))
  }


  return (
    <div 
      className="w-12 bg-dark-base flex flex-col justify-between shrink-0 border-r border-dark-border overflow-y-auto hover:w-[145px] transition-all duration-200 group"
      onMouseEnter={() => onHoverChange?.(true)}   // ✅ NEW
      onMouseLeave={() => onHoverChange?.(false)}  // ✅ NEW
    >
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Core Items */}
        {coreItems.map((item) => {
          const isActive = activeItem === item.id
          const Icon = item.icon
          
          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`
                relative flex items-center gap-2.5 px-2.5 py-2.5 cursor-pointer transition-all
                ${isActive 
                  ? 'text-white bg-primary/40 border-r-4 border-primary shadow-[inset_0_0_20px_rgba(0,122,204,0.3)]' 
                  : 'text-text-secondary hover:bg-primary/20 hover:text-primary hover:border-r-2 hover:border-primary/70'
                }
              `}
              title={item.label}
            >
              {isActive && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(0,122,204,1),0_0_40px_rgba(0,122,204,0.5)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
                </>
              )}
              {!isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0 bg-primary shadow-[0_0_15px_rgba(0,122,204,0.8)] group-hover:w-1 transition-all" />
              )}
              <Icon 
                size={20} 
                strokeWidth={isActive ? 3 : 1.5} 
                className={`flex-shrink-0 transition-all ${
                  isActive 
                    ? 'text-primary drop-shadow-[0_0_15px_rgba(0,122,204,1)] brightness-125 scale-110' 
                    : 'group-hover:text-primary group-hover:drop-shadow-[0_0_10px_rgba(0,122,204,0.7)] group-hover:brightness-110 group-hover:scale-105'
                }`}
              />
              <span className={`text-[13px] truncate opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                isActive ? 'font-bold text-primary drop-shadow-[0_0_8px_rgba(0,122,204,0.5)]' : 'group-hover:font-semibold group-hover:text-primary'
              }`}>
                {item.label}
              </span>
            </div>
          )
        })}


        {/* Separator */}
        <div className="w-8 h-[1px] bg-dark-border mx-auto my-1" />


        {/* Collapsible Sections */}
        {sections.map((section) => {
          const SectionIcon = section.icon
          
          return (
            <div key={section.id}>
              <div
                onClick={() => toggleSection(section.id)}
                className={`
                  relative flex items-center gap-2.5 px-2.5 py-2.5 cursor-pointer transition-all
                  hover:bg-white/10 hover:brightness-110
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


              {section.expanded && (
                <div className="flex flex-col bg-dark-surface/50">
                  {section.items.map((item) => {
                    const isActive = activeItem === item.id
                    const ItemIcon = item.icon
                    const colorClass = item.color || 'text-primary'
                    const getColorRgb = (color: string) => {
                      const colorMap: Record<string, string> = {
                        'text-green-400': '74,222,128',
                        'text-cyan-400': '34,211,238',
                        'text-orange-400': '251,146,60',
                        'text-red-400': '248,113,113',
                        'text-pink-400': '244,114,182',
                        'text-indigo-400': '129,140,248',
                        'text-teal-400': '45,212,191',
                      }
                      return colorMap[color] || '0,122,204'
                    }
                    const rgb = getColorRgb(colorClass)
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        className={`
                          group/item relative flex items-center gap-2.5 px-2.5 py-2 pl-5 cursor-pointer transition-all
                          ${isActive 
                            ? `bg-white/15 text-white border-r-4 ${colorClass.replace('text-', 'border-')} shadow-[inset_0_0_20px_rgba(${rgb},0.3)]` 
                            : `text-text-secondary hover:bg-white/10 hover:${colorClass} hover:border-r-2 hover:border-current/70 hover:brightness-110`
                          }
                        `}
                      >
                        {isActive && (
                          <>
                            <div 
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorClass.replace('text-', 'bg-')}`}
                              style={{ boxShadow: `0 0 20px rgba(${rgb},1), 0 0 40px rgba(${rgb},0.5)` }}
                            />
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{ background: `linear-gradient(to right, rgba(${rgb},0.2), transparent)` }}
                            />
                          </>
                        )}
                        {!isActive && (
                          <div 
                            className={`absolute left-0 top-0 bottom-0 w-0 ${colorClass.replace('text-', 'bg-')} group-hover/item:w-1 transition-all`}
                            style={{ boxShadow: `0 0 15px rgba(${rgb},0.8)` }}
                          />
                        )}
                        <ItemIcon 
                          size={16} 
                          strokeWidth={isActive ? 3 : 1.5}
                          className={`flex-shrink-0 transition-all ${colorClass} ${
                            isActive ? 'brightness-125 scale-110' : 'group-hover/item:brightness-110 group-hover/item:scale-105'
                          }`}
                          style={isActive ? { filter: `drop-shadow(0 0 15px rgba(${rgb},1))` } : {}}
                        />
                        <span className={`text-[12px] truncate opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                          isActive ? `font-bold ${colorClass}` : 'group-hover:font-semibold'
                        }`}
                        style={isActive ? { textShadow: `0 0 8px rgba(${rgb},0.5)` } : {}}
                        >
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


      {/* Bottom Icons */}
      <div className="flex flex-col border-t border-dark-border">
        <div
          onClick={() => onItemClick('account')}
          className={`
            relative flex items-center gap-2.5 px-2.5 py-2.5 cursor-pointer transition-all
            ${activeItem === 'account' 
              ? 'bg-primary/40 text-white border-r-4 border-primary shadow-[inset_0_0_20px_rgba(0,122,204,0.3)]' 
              : 'text-text-secondary hover:bg-primary/20 hover:text-primary hover:border-r-2 hover:border-primary/70'
            }
          `}
          title="Account"
        >
          {activeItem === 'account' && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(0,122,204,1),0_0_40px_rgba(0,122,204,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
            </>
          )}
          <User 
            size={20} 
            strokeWidth={activeItem === 'account' ? 3 : 1.5}
            className={`flex-shrink-0 transition-all ${
              activeItem === 'account' 
                ? 'text-primary drop-shadow-[0_0_15px_rgba(0,122,204,1)] brightness-125 scale-110' 
                : 'group-hover:text-primary group-hover:drop-shadow-[0_0_10px_rgba(0,122,204,0.7)] group-hover:brightness-110 group-hover:scale-105'
            }`}
          />
          <span className={`text-[13px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
            activeItem === 'account' ? 'font-bold text-primary drop-shadow-[0_0_8px_rgba(0,122,204,0.5)]' : 'group-hover:font-semibold group-hover:text-primary'
          }`}>
            Account
          </span>
        </div>
        
        <div
          onClick={() => onItemClick('settings')}
          className={`
            relative flex items-center gap-2.5 px-2.5 py-2.5 cursor-pointer transition-all
            ${activeItem === 'settings' 
              ? 'bg-primary/40 text-white border-r-4 border-primary shadow-[inset_0_0_20px_rgba(0,122,204,0.3)]' 
              : 'text-text-secondary hover:bg-primary/20 hover:text-primary hover:border-r-2 hover:border-primary/70'
            }
          `}
          title="Settings"
        >
          {activeItem === 'settings' && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(0,122,204,1),0_0_40px_rgba(0,122,204,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
            </>
          )}
          <Settings 
            size={20} 
            strokeWidth={activeItem === 'settings' ? 3 : 1.5}
            className={`flex-shrink-0 transition-all ${
              activeItem === 'settings' 
                ? 'text-primary drop-shadow-[0_0_15px_rgba(0,122,204,1)] brightness-125 scale-110' 
                : 'group-hover:text-primary group-hover:drop-shadow-[0_0_10px_rgba(0,122,204,0.7)] group-hover:brightness-110 group-hover:scale-105'
            }`}
          />
          <span className={`text-[13px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
            activeItem === 'settings' ? 'font-bold text-primary drop-shadow-[0_0_8px_rgba(0,122,204,0.5)]' : 'group-hover:font-semibold group-hover:text-primary'
          }`}>
            Settings
          </span>
        </div>
      </div>
    </div>
  )
}
