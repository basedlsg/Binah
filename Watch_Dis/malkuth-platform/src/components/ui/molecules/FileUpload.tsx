import React, { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import Button from '../atoms/Button'
import Typography from '../atoms/Typography'

interface FileUploadProps {
  onFileSelect: (files: FileList) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  loading?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    onFileSelect, 
    accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
    multiple = false,
    maxSize = 50,
    loading = false,
    disabled = false,
    className,
    children,
    ...props 
  }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFiles = (files: FileList): boolean => {
      setError(null)
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileSizeMB = file.size / (1024 * 1024)
        
        if (fileSizeMB > maxSize) {
          setError(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`)
          return false
        }
      }
      
      return true
    }

    const handleFileSelect = useCallback((files: FileList) => {
      if (!files || files.length === 0) return
      
      if (validateFiles(files)) {
        onFileSelect(files)
      }
    }, [onFileSelect, maxSize])

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      
      if (disabled || loading) return
      
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files)
      }
    }, [handleFileSelect, disabled, loading])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !loading) {
        setIsDragging(true)
      }
    }, [disabled, loading])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }, [])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    }, [handleFileSelect])

    const handleClick = () => {
      if (!disabled && !loading) {
        fileInputRef.current?.click()
      }
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
            'hover:border-gray-500',
            isDragging && 'border-blue-500 bg-blue-500/10',
            !isDragging && 'border-gray-600',
            (disabled || loading) && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="space-y-4">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>

            {/* Content */}
            {children || (
              <div>
                <Typography variant="h6" className="mb-2">
                  {isDragging ? 'Drop files here' : loading ? 'Uploading...' : 'Upload files'}
                </Typography>
                <Typography variant="body" color="secondary" className="mb-4">
                  Drag & drop files here, or click to select
                </Typography>
                <Button
                  variant="primary"
                  disabled={disabled || loading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  Choose Files
                </Button>
              </div>
            )}

            {/* File info */}
            <Typography variant="caption" color="muted">
              {accept === "image/*" ? "Images only" : "Images, videos, audio, documents"} • Max {maxSize}MB
            </Typography>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
            <Typography variant="small" className="text-red-400">
              {error}
            </Typography>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || loading}
        />
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export default FileUpload