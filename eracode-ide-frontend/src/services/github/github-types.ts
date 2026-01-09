// src/services/github/github-types.ts

/**
 * GitHub API Response Types
 * These match the actual GitHub REST API responses
 */

export interface GitHubUser {
    login: string
    id: number
    avatar_url: string
    html_url: string
    name: string
    email: string
}

export interface GitHubRepository {
    id: number
    name: string
    full_name: string
    owner: {
        login: string
        avatar_url: string
    }
    html_url: string
    description: string
    private: boolean
    default_branch: string
}

export interface WorkflowFile {
    id: number
    node_id: string
    name: string
    path: string
    state: 'active' | 'disabled' | 'deleted'
    created_at: string
    updated_at: string
    url: string
    html_url: string
    badge_url: string
}

export interface WorkflowRunResponse {
    total_count: number
    workflow_runs: WorkflowRunDetail[]
}

export interface WorkflowRunDetail {
    id: number
    name: string
    node_id: string
    head_branch: string
    head_sha: string
    path: string
    display_title: string
    run_number: number
    event: string
    status: 'queued' | 'in_progress' | 'completed' | 'waiting'
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
    workflow_id: number
    check_suite_id: number
    check_suite_node_id: string
    url: string
    html_url: string
    created_at: string
    updated_at: string
    actor: {
        login: string
        avatar_url: string
    }
    run_attempt: number
    run_started_at: string
    triggering_actor: {
        login: string
        avatar_url: string
    }
    jobs_url: string
    logs_url: string
    check_suite_url: string
    artifacts_url: string
    cancel_url: string
    rerun_url: string
    workflow_url: string
    head_commit: {
        id: string
        tree_id: string
        message: string
        timestamp: string
        author: {
            name: string
            email: string
        }
        committer: {
            name: string
            email: string
        }
    }
    repository: {
        id: number
        name: string
        full_name: string
    }
    head_repository: {
        id: number
        name: string
        full_name: string
    }
}

export interface JobsResponse {
    total_count: number
    jobs: JobDetail[]
}

export interface JobDetail {
    id: number
    run_id: number
    run_url: string
    node_id: string
    head_sha: string
    url: string
    html_url: string
    status: 'queued' | 'in_progress' | 'completed' | 'waiting'
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
    started_at: string
    completed_at: string
    name: string
    steps: StepDetail[]
    check_run_url: string
    labels: string[]
    runner_id: number | null
    runner_name: string | null
    runner_group_id: number | null
    runner_group_name: string | null
}

export interface StepDetail {
    name: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
    number: number
    started_at: string
    completed_at: string
}

export interface WorkflowDispatchInputs {
    [key: string]: string | number | boolean
}

export interface TriggerWorkflowRequest {
    ref: string
    inputs?: WorkflowDispatchInputs
}

export interface GitHubError {
    message: string
    documentation_url: string
    status: number
}
