// Terminal type definitions
export type TerminalType = 'local' | 'cloud' | null;

export interface CloudTerminalConfig {
    region: string;
}

// Fixed instance type for Version 1
export const CLOUD_INSTANCE = {
    type: 't3.micro',
    vCPU: 2,
    ram: '1GB',
    description: 'Lightweight cloud terminal',
    estimatedStartup: '~60 seconds'
} as const;

export const AWS_REGIONS = [
    { value: 'eu-west-1', label: 'Europe (Ireland)', flag: '🇮🇪' },  // Your region - moved to top
    { value: 'us-east-1', label: 'US East (N. Virginia)', flag: '🇺🇸' },
    { value: 'us-west-2', label: 'US West (Oregon)', flag: '🇺🇸' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)', flag: '🇮🇳' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)', flag: '🇸🇬' },
] as const;

// Default region
export const DEFAULT_AWS_REGION = 'eu-west-1';  // Ireland
