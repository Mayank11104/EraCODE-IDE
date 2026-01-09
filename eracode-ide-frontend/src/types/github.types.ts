// src/types/github.types.ts

export interface GitHubConfig {
    owner: string
    repo: string
    token: string
}

export interface Workflow {
    id: number
    name: string
    path: string
    state: 'active' | 'disabled'
    created_at: string
    updated_at: string
}

export interface WorkflowRun {
    id: number
    name: string
    head_branch: string
    head_sha: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
    html_url: string
    created_at: string
    updated_at: string
    run_started_at: string
}

export interface Job {
    id: number
    name: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
    started_at: string
    completed_at: string
    steps: Step[]
}

export interface Step {
    name: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
    number: number
    started_at: string
    completed_at: string
}
