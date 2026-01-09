// src/services/github/github-actions.service.ts

import { Octokit } from 'octokit'
import { Workflow, WorkflowRun, Job } from '../../types/github.types'

export class GitHubActionsService {
    private octokit: Octokit
    private owner: string
    private repo: string

    constructor(owner: string, repo: string, token: string) {
        this.owner = owner
        this.repo = repo
        this.octokit = new Octokit({ auth: token })

        console.log('🔧 GitHubActionsService initialized:', { owner, repo })
    }

    /**
     * Get all workflows for the repository
     */
    async getWorkflows(): Promise<Workflow[]> {
        try {
            console.log('📥 Fetching workflows...')
            const response = await this.octokit.rest.actions.listRepoWorkflows({
                owner: this.owner,
                repo: this.repo,
            })
            console.log('✅ Workflows fetched:', response.data.workflows.length)
            return response.data.workflows as Workflow[]
        } catch (error) {
            console.error('❌ Failed to fetch workflows:', error)
            throw error
        }
    }

    /**
     * Alias for getWorkflows - used by hooks
     */
    async listWorkflows(): Promise<Workflow[]> {
        return this.getWorkflows()
    }

    /**
     * Get workflow runs for the repository
     */
    async getWorkflowRuns(perPage: number = 20): Promise<WorkflowRun[]> {
        try {
            console.log('📥 Fetching workflow runs...')
            const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
                owner: this.owner,
                repo: this.repo,
                per_page: perPage,
            })
            console.log('✅ Workflow runs fetched:', response.data.workflow_runs.length)
            return response.data.workflow_runs as WorkflowRun[]
        } catch (error) {
            console.error('❌ Failed to fetch workflow runs:', error)
            throw error
        }
    }

    /**
     * Get a single workflow run by ID
     */
    async getWorkflowRun(runId: number): Promise<WorkflowRun> {
        try {
            console.log('📥 Fetching workflow run:', runId)
            const response = await this.octokit.rest.actions.getWorkflowRun({
                owner: this.owner,
                repo: this.repo,
                run_id: runId,
            })
            console.log('✅ Workflow run fetched:', response.data.name, response.data.status)
            return response.data as WorkflowRun
        } catch (error) {
            console.error('❌ Failed to fetch workflow run:', error)
            throw error
        }
    }

    /**
     * Get jobs for a workflow run
     */
    async getWorkflowJobs(runId: number): Promise<Job[]> {
        try {
            console.log('📥 Fetching jobs for run:', runId)
            const response = await this.octokit.rest.actions.listJobsForWorkflowRun({
                owner: this.owner,
                repo: this.repo,
                run_id: runId,
            })
            console.log('✅ Jobs fetched:', response.data.jobs.length)
            return response.data.jobs as Job[]
        } catch (error) {
            console.error('❌ Failed to fetch jobs:', error)
            throw error
        }
    }

    /**
     * Trigger a workflow
     */
    async triggerWorkflow(workflowId: number, ref: string = 'main'): Promise<void> {
        try {
            console.log('🚀 Triggering workflow:', workflowId, 'on branch:', ref)
            await this.octokit.rest.actions.createWorkflowDispatch({
                owner: this.owner,
                repo: this.repo,
                workflow_id: workflowId,
                ref,
            })
            console.log('✅ Workflow triggered successfully')
        } catch (error) {
            console.error('❌ Failed to trigger workflow:', error)
            throw error
        }
    }

    /**
     * Get job logs (optional - for future use)
     */
    async getJobLogs(jobId: number): Promise<string> {
        try {
            console.log('📥 Fetching logs for job:', jobId)
            const response = await this.octokit.rest.actions.downloadJobLogsForWorkflowRun({
                owner: this.owner,
                repo: this.repo,
                job_id: jobId,
            })
            console.log('✅ Logs fetched')
            return response.data as any
        } catch (error) {
            console.error('❌ Failed to fetch logs:', error)
            throw error
        }
    }

    /**
     * Cancel a workflow run (optional - for future use)
     */
    async cancelWorkflowRun(runId: number): Promise<void> {
        try {
            console.log('🛑 Canceling workflow run:', runId)
            await this.octokit.rest.actions.cancelWorkflowRun({
                owner: this.owner,
                repo: this.repo,
                run_id: runId,
            })
            console.log('✅ Workflow run canceled')
        } catch (error) {
            console.error('❌ Failed to cancel workflow run:', error)
            throw error
        }
    }

    /**
     * Re-run a workflow
     */
    async rerunWorkflow(runId: number): Promise<void> {
        try {
            console.log('🔄 Re-running workflow:', runId)
            await this.octokit.rest.actions.reRunWorkflow({
                owner: this.owner,
                repo: this.repo,
                run_id: runId,
            })
            console.log('✅ Workflow re-run triggered')
        } catch (error) {
            console.error('❌ Failed to re-run workflow:', error)
            throw error
        }
    }
}
