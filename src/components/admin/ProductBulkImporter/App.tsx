'use client'

import React, { useCallback, useRef, useState } from 'react'

type RowResult = {
  rowNumber: number
  title: string
  action: 'created' | 'updated' | 'error'
  message: string
  warnings: string[]
}

type UploadResponse = {
  results: RowResult[]
  createdCount: number
  updatedCount: number
  errorCount: number
}

function statusIcon(action: RowResult['action']) {
  switch (action) {
    case 'created':
      return '✓'
    case 'updated':
      return '↻'
    case 'error':
      return '✕'
  }
}

export const ProductBulkImporterApp: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<UploadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)
    setResponse(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/product-bulk-import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Upload failed (${res.status})`)
      }

      const data: UploadResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }, [])

  const onFileSelected = (file: File | undefined) => {
    if (!file) return
    void uploadFile(file)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    onFileSelected(e.dataTransfer.files?.[0])
  }

  return (
    <div className="pbi">
      <a className="pbi__button" href="/api/product-bulk-import/sample" download>
        Download sample spreadsheet
      </a>

      <div
        className={`pbi__dropzone${isDragging ? ' pbi__dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => onFileSelected(e.target.files?.[0])}
        />
        {isUploading ? (
          <p>Processing your spreadsheet…</p>
        ) : (
          <p>
            Drag and drop your filled-in spreadsheet here, or <strong>click to choose a file</strong>.
          </p>
        )}
      </div>

      {error ? <p className="pbi__error">{error}</p> : null}

      {response ? (
        <div className="pbi__results">
          <p className="pbi__summary">
            <span className="pbi__summary-item pbi__summary-item--created">
              {response.createdCount} created
            </span>
            <span className="pbi__summary-item pbi__summary-item--updated">
              {response.updatedCount} updated
            </span>
            <span className="pbi__summary-item pbi__summary-item--error">
              {response.errorCount} failed
            </span>
          </p>

          <table className="pbi__table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Product</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {response.results.map((row) => (
                <tr key={row.rowNumber} className={`pbi__row pbi__row--${row.action}`}>
                  <td>{row.rowNumber}</td>
                  <td>{row.title || '—'}</td>
                  <td>
                    {statusIcon(row.action)} {row.message}
                  </td>
                  <td>
                    {row.warnings.length > 0 ? (
                      <ul className="pbi__warnings">
                        {row.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
