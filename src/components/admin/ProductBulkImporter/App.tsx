'use client'

import { toast } from '@payloadcms/ui'
import React, { useCallback, useMemo, useRef, useState } from 'react'

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

type NamedOption = { id: number; label: string }

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

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}"`)
  } catch {
    toast.error('Could not copy to clipboard.')
  }
}

type Props = {
  categories: NamedOption[]
  tags: NamedOption[]
  packTypes: string[]
}

export const ProductBulkImporterApp: React.FC<Props> = ({ categories, tags, packTypes }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<UploadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [filterCategoryIds, setFilterCategoryIds] = useState<Set<number>>(new Set())
  const [filterTagIds, setFilterTagIds] = useState<Set<number>>(new Set())
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all')

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

  const toggleFilter = (set: Set<number>, setSet: (s: Set<number>) => void, id: number) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSet(next)
  }

  const hasFilters = filterCategoryIds.size > 0 || filterTagIds.size > 0 || filterStatus !== 'all'

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (filterCategoryIds.size > 0) params.set('categories', [...filterCategoryIds].join(','))
    if (filterTagIds.size > 0) params.set('tags', [...filterTagIds].join(','))
    if (filterStatus !== 'all') params.set('status', filterStatus)
    const query = params.toString()
    return `/api/product-bulk-import/export${query ? `?${query}` : ''}`
  }, [filterCategoryIds, filterTagIds, filterStatus])

  return (
    <div className="pbi">
      <div className="pbi__actions">
        <a className="pbi__button" href="/api/product-bulk-import/sample" download>
          Download sample spreadsheet
        </a>
      </div>

      <div className="pbi__reference">
        <ReferenceList title="Existing Categories" items={categories.map((c) => c.label)} />
        <ReferenceList title="Existing Tags" items={tags.map((t) => t.label)} />
        <ReferenceList title="Pack Types" items={packTypes} />
      </div>

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

      <div className="pbi__export">
        <h2 className="pbi__section-title">Export Products</h2>
        <p className="product-bulk-importer-view__intro">
          Leave everything unselected to export every product, or narrow it down below.
        </p>

        <div className="pbi__export-filters">
          <div className="pbi__filter-group">
            <span className="pbi__reference-title">Status</span>
            <select
              className="pbi__select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">All</option>
              <option value="active">Active (published) only</option>
              <option value="draft">Draft only</option>
            </select>
          </div>

          <FilterChipGroup
            title="Categories"
            items={categories}
            selected={filterCategoryIds}
            onToggle={(id) => toggleFilter(filterCategoryIds, setFilterCategoryIds, id)}
          />
          <FilterChipGroup
            title="Tags"
            items={tags}
            selected={filterTagIds}
            onToggle={(id) => toggleFilter(filterTagIds, setFilterTagIds, id)}
          />
        </div>

        <a className="pbi__button pbi__button--primary" href={exportUrl} download>
          {hasFilters ? 'Export filtered products' : 'Export all products'}
        </a>
      </div>
    </div>
  )
}

const ReferenceList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  if (items.length === 0) return null
  return (
    <div className="pbi__reference-list">
      <h3 className="pbi__reference-title">{title}</h3>
      <div className="pbi__reference-chips">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="pbi__chip pbi__chip--copy"
            onClick={() => void copyToClipboard(item)}
            title="Click to copy"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

const FilterChipGroup: React.FC<{
  title: string
  items: NamedOption[]
  selected: Set<number>
  onToggle: (id: number) => void
}> = ({ title, items, selected, onToggle }) => {
  if (items.length === 0) return null
  return (
    <div className="pbi__filter-group">
      <span className="pbi__reference-title">{title}</span>
      <div className="pbi__reference-chips">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`pbi__chip pbi__chip--filter${selected.has(item.id) ? ' pbi__chip--selected' : ''}`}
            onClick={() => onToggle(item.id)}
          >
            {selected.has(item.id) ? '✓ ' : ''}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
