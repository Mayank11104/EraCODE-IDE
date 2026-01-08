import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#e2e8f0',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#94a3b8',
        lineColor: '#64748b',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#f1f5f9'
    }
});

interface MermaidRendererProps {
    code: string;
    zoom?: number;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, zoom = 100 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!code || !containerRef.current) return;

            try {
                setError(null);
                // Clear previous content
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }

                // Generate unique ID
                const id = `mermaid-${Date.now()}`;

                // Render
                await mermaid.parse(code); // Validate syntax first
                const { svg } = await mermaid.render(id, code);

                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (err: any) {
                console.error("Mermaid Render Error:", err);
                setError("Failed to render diagram. Syntax might be invalid.");
            }
        };

        renderDiagram();
    }, [code]);

    return (
        <div className="mermaid-container p-4 bg-white rounded-lg shadow-sm border border-gray-100 overflow-auto flex justify-center min-h-[400px]">
            {error ? (
                <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">
                    {error}
                    <pre className="mt-2 text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-x-auto">
                        {code}
                    </pre>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="w-full text-center transition-transform duration-200 ease-in-out origin-center"
                    style={{ transform: `scale(${zoom / 100})` }}
                />
            )}
        </div>
    );
};

export default MermaidRenderer;
