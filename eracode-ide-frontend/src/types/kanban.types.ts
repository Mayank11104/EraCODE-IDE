// src/types/kanban.types.ts (create this file)

export type Priority = 'high' | 'medium' | 'low'

export interface Comment {
    id: string
    author: string
    text: string
    timestamp: string
}

export interface Subtask {
    id: string
    title: string
    completed: boolean
}

export interface Card {
    id: string
    title: string
    description?: string
    assignee?: string
    labels?: string[]
    dueDate?: string
    branch?: string
    status: string
    priority?: Priority
    comments?: Comment[]
    subtasks?: Subtask[]
    archived?: boolean
    archivedAt?: string
}
