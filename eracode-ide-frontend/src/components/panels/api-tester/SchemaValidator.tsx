import { useState } from 'react'
import { FileJson, CheckCircle, XCircle, AlertCircle, Shield, Code, Database } from 'lucide-react'

interface ValidationError {
  path: string
  message: string
}

export default function SchemaValidator() {
  const [schema, setSchema] = useState(`{
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "number", "minimum": 0 }
  }
}`)

  const [data, setData] = useState(`{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`)

  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateSchema = () => {
    try {
      const schemaObj = JSON.parse(schema)
      const dataObj = JSON.parse(data)
      const validationErrors: ValidationError[] = []

      // Simple validation logic
      const validate = (schema: any, data: any, path = '') => {
        // Check required fields
        if (schema.required && Array.isArray(schema.required)) {
          schema.required.forEach((field: string) => {
            if (!(field in data)) {
              validationErrors.push({
                path: path ? `${path}.${field}` : field,
                message: `Required field missing`
              })
            }
          })
        }

        // Check properties
        if (schema.properties) {
          Object.keys(schema.properties).forEach((key) => {
            const propSchema = schema.properties[key]
            const propData = data[key]
            const propPath = path ? `${path}.${key}` : key

            if (propData !== undefined) {
              // Type check
              if (propSchema.type) {
                const actualType = Array.isArray(propData) ? 'array' : typeof propData
                if (actualType !== propSchema.type) {
                  validationErrors.push({
                    path: propPath,
                    message: `Expected type "${propSchema.type}" but got "${actualType}"`
                  })
                }
              }

              // Number validations
              if (propSchema.type === 'number') {
                if (propSchema.minimum !== undefined && propData < propSchema.minimum) {
                  validationErrors.push({
                    path: propPath,
                    message: `Value ${propData} is less than minimum ${propSchema.minimum}`
                  })
                }
                if (propSchema.maximum !== undefined && propData > propSchema.maximum) {
                  validationErrors.push({
                    path: propPath,
                    message: `Value ${propData} is greater than maximum ${propSchema.maximum}`
                  })
                }
              }

              // String validations
              if (propSchema.type === 'string') {
                if (propSchema.minLength && propData.length < propSchema.minLength) {
                  validationErrors.push({
                    path: propPath,
                    message: `String length ${propData.length} is less than minLength ${propSchema.minLength}`
                  })
                }
                if (propSchema.format === 'email' && !propData.includes('@')) {
                  validationErrors.push({
                    path: propPath,
                    message: `Invalid email format`
                  })
                }
              }

              // Nested objects
              if (propSchema.type === 'object' && typeof propData === 'object') {
                validate(propSchema, propData, propPath)
              }
            }
          })
        }
      }

      validate(schemaObj, dataObj)
      setErrors(validationErrors)
      setIsValid(validationErrors.length === 0)

    } catch (error: any) {
      setErrors([{ path: 'root', message: `Parse error: ${error.message}` }])
      setIsValid(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{backgroundColor: '#1E1E1E'}}>
      {/* Header */}
      <div className="p-6 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#252525] to-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg ring-1 ring-violet-400/30">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-base font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              JSON Schema Validator
            </h3>
          </div>
          <button
            onClick={validateSchema}
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <FileJson className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Validate</span>
          </button>
        </div>

        {isValid !== null && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${
            isValid 
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/20' 
              : 'bg-red-500/20 border-red-500/50 shadow-red-500/20'
          }`}>
            {isValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-emerald-300">✅ Data is valid! All checks passed.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-sm font-bold text-red-300">❌ Validation failed ({errors.length} {errors.length === 1 ? 'error' : 'errors'})</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="px-5 py-3 bg-gradient-to-r from-[#252525] to-[#2A2A2A] border-b border-white/10">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">JSON Schema</h4>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="w-full h-full bg-[#1E1E1E] p-5 text-sm font-mono text-gray-300 resize-none focus:outline-none"
              style={{
                caretColor: '#22D3EE'
              }}
              spellCheck={false}
            />
            {/* Line numbers hint */}
            <div className="absolute top-5 left-1 text-[10px] font-mono text-gray-700 select-none pointer-events-none">
              {schema.split('\n').map((_, i) => (
                <div key={i} className="leading-5 text-right pr-2" style={{minWidth: '2rem'}}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3 bg-gradient-to-r from-[#252525] to-[#2A2A2A] border-b border-white/10">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">JSON Data</h4>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full h-full bg-[#1E1E1E] p-5 text-sm font-mono text-gray-300 resize-none focus:outline-none"
              style={{
                caretColor: '#A78BFA'
              }}
              spellCheck={false}
            />
            {/* Line numbers hint */}
            <div className="absolute top-5 left-1 text-[10px] font-mono text-gray-700 select-none pointer-events-none">
              {data.split('\n').map((_, i) => (
                <div key={i} className="leading-5 text-right pr-2" style={{minWidth: '2rem'}}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="shrink-0 border-t border-white/10 bg-gradient-to-r from-[#252525] to-[#2A2A2A]">
          <div className="px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h4 className="text-xs font-bold text-red-300 uppercase tracking-wide">
                Validation Errors ({errors.length})
              </h4>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-5 space-y-3">
            {errors.map((error, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-colors group"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-sm font-bold text-red-300 mb-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs">
                      {error.path}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">{error.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}