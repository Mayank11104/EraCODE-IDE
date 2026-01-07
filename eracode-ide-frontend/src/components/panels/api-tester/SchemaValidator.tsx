import { useState } from 'react'
import { FileJson, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">JSON Schema Validator</h3>
          <button
            onClick={validateSchema}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            Validate
          </button>
        </div>

        {isValid !== null && (
          <div className={`flex items-center gap-2 p-3 rounded ${
            isValid ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {isValid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">✅ Data is valid!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">❌ Validation failed ({errors.length} errors)</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema */}
        <div className="flex-1 flex flex-col border-r border-dark-border">
          <div className="px-4 py-2 bg-dark-bg border-b border-dark-border">
            <h4 className="text-xs font-semibold text-text-secondary">JSON Schema</h4>
          </div>
          <textarea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            className="flex-1 bg-dark-surface p-4 text-sm font-mono text-white resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Data */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-dark-bg border-b border-dark-border">
            <h4 className="text-xs font-semibold text-text-secondary">JSON Data</h4>
          </div>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="flex-1 bg-dark-surface p-4 text-sm font-mono text-white resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="shrink-0 border-t border-dark-border bg-dark-bg">
          <div className="px-4 py-2 border-b border-dark-border">
            <h4 className="text-xs font-semibold text-red-400">Validation Errors</h4>
          </div>
          <div className="max-h-48 overflow-y-auto p-4 space-y-2">
            {errors.map((error, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-red-400">{error.path}</div>
                  <div className="text-text-secondary">{error.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
