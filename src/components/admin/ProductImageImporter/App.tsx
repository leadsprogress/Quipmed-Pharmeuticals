'use client'

import React, { useCallback, useRef, useState } from 'react'

type PageRow = {
  id?: string | null
  pageNumber: number
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'MATCHED'
    | 'CROPPED'
    | 'UPLOADED'
    | 'COMPLETED'
    | 'NEEDS_REVIEW'
    | 'FAILED'
    | 'SKIPPED'
  detectedProductName?: string | null
  composition?: string | null
  strength?: string | null
  packSize?: string | null
  mrp?: string | null
  claudeConfidence?: number | null
  claudeNotes?: string | null
  cropBox?: { present?: boolean | null; x?: number | null; y?: number | null; width?: number | null; height?: number | null }
  matchedProduct?: number | { id: number; title?: string } | null
  matchConfidence?: number | null
  matchMethod?: string | null
  validation?: { valid?: boolean | null; confidence?: number | null; reason?: string | null }
  uploadedMedia?: number | { id: number; url?: string } | null
  imported?: boolean | null
  error?: string | null
}

type Job = {
  id: string
  filename: string
  pageCount: number
  dryRun?: boolean | null
  allowReplaceExisting?: boolean | null
  jobStatus?: string | null
  pages?: PageRow[] | null
}

type ProductSuggestion = { id: number; title: string }

const CONCURRENCY = 3

function statusIcon(status: PageRow['status']) {
  switch (status) {
    case 'COMPLETED':
      return '✓'
    case 'CROPPED':
      return '●'
    case 'NEEDS_REVIEW':
      return '⚠'
    case 'FAILED':
      return '✕'
    case 'SKIPPED':
      return '⏭'
    case 'PROCESSING':
      return '…'
    default:
      return '·'
  }
}

function matchedProductId(row: PageRow): number | null {
  if (!row.matchedProduct) return null
  return typeof row.matchedProduct === 'object' ? row.matchedProduct.id : row.matchedProduct
}

export const ProductImageImporterApp: React.FC = () => {
  const [job, setJob] = useState<Job | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState<number | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [selectedForImport, setSelectedForImport] = useState<Set<number>>(new Set())
  const [productQuery, setProductQuery] = useState<Record<number, string>>({})
  const [productResults, setProductResults] = useState<Record<number, ProductSuggestion[]>>({})
  const cancelRef = useRef(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const pages = job?.pages || []
  const doneCount = pages.filter((p) =>
    ['COMPLETED', 'CROPPED', 'NEEDS_REVIEW', 'FAILED', 'SKIPPED'].includes(p.status),
  ).length

  async function handleUpload(file: File) {
    setIsUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/product-image-importer', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setJob(data.job)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  async function updateSettings(patch: { dryRun?: boolean; allowReplaceExisting?: boolean }) {
    if (!job) return
    const res = await fetch(`/api/product-image-importer/${job.id}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (res.ok) setJob(data.job)
  }

  const processOnePage = useCallback(
    async (pageNumber: number) => {
      if (!job) return
      setCurrentPage(pageNumber)
      const res = await fetch(`/api/product-image-importer/${job.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber }),
      })
      const data = await res.json()
      const updatedPage: PageRow | undefined = data.page
      if (updatedPage) {
        setJob((prev) => {
          if (!prev) return prev
          const nextPages = (prev.pages || []).map((p) =>
            p.pageNumber === pageNumber ? updatedPage : p,
          )
          return { ...prev, pages: nextPages }
        })
      }
    },
    [job],
  )

  async function startProcessing(pageNumbers?: number[]) {
    if (!job) return
    setIsProcessing(true)
    cancelRef.current = false

    const queue = pageNumbers || pages.map((p) => p.pageNumber)
    let index = 0

    async function worker() {
      for (;;) {
        if (cancelRef.current) return
        const i = index
        index += 1
        if (i >= queue.length) return
        await processOnePage(queue[i])
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
    setIsProcessing(false)
    setCurrentPage(null)
  }

  async function searchProducts(pageNumber: number, query: string) {
    setProductQuery((prev) => ({ ...prev, [pageNumber]: query }))
    if (query.trim().length < 2) {
      setProductResults((prev) => ({ ...prev, [pageNumber]: [] }))
      return
    }
    const res = await fetch(
      `/api/products?where[title][contains]=${encodeURIComponent(query)}&limit=10&depth=0&select[title]=true`,
    )
    const data = await res.json()
    setProductResults((prev) => ({
      ...prev,
      [pageNumber]: (data.docs || []).map((d: { id: number; title: string }) => ({ id: d.id, title: d.title })),
    }))
  }

  async function applyManualMatch(pageNumber: number, productId: number) {
    if (!job) return
    const res = await fetch(`/api/product-image-importer/${job.id}/manual-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber, productId }),
    })
    const data = await res.json()
    if (res.ok && data.page) {
      setJob((prev) => {
        if (!prev) return prev
        const nextPages = (prev.pages || []).map((p) => (p.pageNumber === pageNumber ? data.page : p))
        return { ...prev, pages: nextPages }
      })
    }
  }

  async function importSelected() {
    if (!job || selectedForImport.size === 0) return
    const res = await fetch(`/api/product-image-importer/${job.id}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumbers: Array.from(selectedForImport) }),
    })
    const data = await res.json()
    // Re-fetch the job to pick up the final per-page state written server-side.
    const jobRes = await fetch(`/api/product-image-importer/${job.id}`)
    const jobData = await jobRes.json()
    if (jobRes.ok) setJob(jobData.job)
    setSelectedForImport(new Set())
    if (data.results?.some((r: { ok: boolean }) => !r.ok)) {
      // eslint-disable-next-line no-alert
      alert('Some pages were skipped or failed — check their status/error in the table.')
    }
  }

  async function revertPage(pageNumber: number) {
    if (!job) return
    await fetch(`/api/product-image-importer/${job.id}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber }),
    })
    const jobRes = await fetch(`/api/product-image-importer/${job.id}`)
    const jobData = await jobRes.json()
    if (jobRes.ok) setJob(jobData.job)
  }

  function toggleSelected(pageNumber: number) {
    setSelectedForImport((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  const importableRows = pages.filter(
    (p) => p.status === 'CROPPED' && p.validation?.valid && matchedProductId(p),
  )

  if (!job) {
    return (
      <div className="pii">
        <div className="pii__upload">
          <input
            ref={fileInputRef}
            accept="application/pdf"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          {isUploading && <p className="pii__status">Uploading and counting pages…</p>}
          {uploadError && <p className="pii__error">{uploadError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="pii">
      <div className="pii__summary">
        <p>
          File: <strong>{job.filename}</strong> · Pages: <strong>{job.pageCount}</strong>
        </p>
        <label className="pii__toggle">
          <input
            checked={job.allowReplaceExisting ?? false}
            type="checkbox"
            onChange={(e) => updateSettings({ allowReplaceExisting: e.target.checked })}
          />
          Allow replacing existing product images
        </label>
      </div>

      {!isProcessing && doneCount === 0 && (
        <button className="pii__button" type="button" onClick={() => startProcessing()}>
          Start Dry Run
        </button>
      )}

      {isProcessing && (
        <div className="pii__progress">
          <p>
            Processing page {doneCount + 1} / {job.pageCount}
            {currentPage ? ` — current: page ${currentPage}` : ''}
          </p>
          <div className="pii__progress-bar">
            <div
              className="pii__progress-fill"
              style={{ width: `${(doneCount / job.pageCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!isProcessing && doneCount > 0 && doneCount < job.pageCount && (
        <button
          className="pii__button"
          type="button"
          onClick={() =>
            startProcessing(pages.filter((p) => p.status === 'PENDING').map((p) => p.pageNumber))
          }
        >
          Resume ({job.pageCount - doneCount} pages left)
        </button>
      )}

      {!isProcessing && doneCount === job.pageCount && (
        <button
          className="pii__button"
          type="button"
          onClick={() =>
            startProcessing(pages.filter((p) => p.status === 'FAILED').map((p) => p.pageNumber))
          }
          disabled={pages.every((p) => p.status !== 'FAILED')}
        >
          Retry Failed Pages
        </button>
      )}

      {importableRows.length > 0 && (
        <button className="pii__button pii__button--primary" type="button" onClick={importSelected} disabled={selectedForImport.size === 0}>
          Import Approved Images ({selectedForImport.size} selected)
        </button>
      )}

      <table className="pii__table">
        <thead>
          <tr>
            <th />
            <th>Page</th>
            <th>Detected Product</th>
            <th>Matched Product</th>
            <th>Confidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((row) => {
            const productId = matchedProductId(row)
            const eligible = row.status === 'CROPPED' && row.validation?.valid && productId
            return (
              <React.Fragment key={row.pageNumber}>
                <tr
                  className="pii__row"
                  onClick={() => setExpandedRow(expandedRow === row.pageNumber ? null : row.pageNumber)}
                >
                  <td>
                    {eligible && (
                      <input
                        checked={selectedForImport.has(row.pageNumber)}
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelected(row.pageNumber)}
                      />
                    )}
                  </td>
                  <td>{row.pageNumber}</td>
                  <td>{row.detectedProductName || '—'}</td>
                  <td>
                    {typeof row.matchedProduct === 'object' ? row.matchedProduct?.title : productId || '—'}
                  </td>
                  <td>{row.matchConfidence != null ? `${Math.round(row.matchConfidence * 100)}%` : '—'}</td>
                  <td>
                    {statusIcon(row.status)} {row.status}
                  </td>
                </tr>
                {expandedRow === row.pageNumber && (
                  <tr className="pii__detail-row">
                    <td colSpan={6}>
                      <div className="pii__detail">
                        <div className="pii__detail-images">
                          <div>
                            <p className="pii__detail-label">Original page</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`Page ${row.pageNumber}`}
                              className="pii__detail-img"
                              src={`/api/product-image-importer/${job.id}/asset?type=page&page=${row.pageNumber}`}
                            />
                          </div>
                          <div>
                            <p className="pii__detail-label">Cropped result</p>
                            {row.cropBox?.present ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={`Crop for page ${row.pageNumber}`}
                                className="pii__detail-img"
                                src={`/api/product-image-importer/${job.id}/asset?type=crop&page=${row.pageNumber}`}
                              />
                            ) : (
                              <p className="pii__status">No crop available</p>
                            )}
                          </div>
                        </div>

                        <dl className="pii__detail-fields">
                          <dt>Composition</dt>
                          <dd>{row.composition || '—'}</dd>
                          <dt>Strength</dt>
                          <dd>{row.strength || '—'}</dd>
                          <dt>Pack size</dt>
                          <dd>{row.packSize || '—'}</dd>
                          <dt>MRP</dt>
                          <dd>{row.mrp || '—'}</dd>
                          <dt>Crop coordinates</dt>
                          <dd>
                            {row.cropBox?.present
                              ? `x:${row.cropBox.x}, y:${row.cropBox.y}, w:${row.cropBox.width}, h:${row.cropBox.height}`
                              : '—'}
                          </dd>
                          <dt>Match method</dt>
                          <dd>{row.matchMethod || '—'}</dd>
                          <dt>Crop validation</dt>
                          <dd>
                            {row.validation
                              ? `${row.validation.valid ? 'PASS' : 'FAIL'} — ${row.validation.reason || ''}`
                              : '—'}
                          </dd>
                          {row.error && (
                            <>
                              <dt>Error</dt>
                              <dd className="pii__error">{row.error}</dd>
                            </>
                          )}
                        </dl>

                        {row.status === 'NEEDS_REVIEW' && (
                          <div className="pii__manual-match">
                            <p className="pii__detail-label">Select the correct product</p>
                            <input
                              placeholder="Search products by title…"
                              type="text"
                              value={productQuery[row.pageNumber] || ''}
                              onChange={(e) => searchProducts(row.pageNumber, e.target.value)}
                            />
                            {(productResults[row.pageNumber] || []).map((p) => (
                              <button
                                key={p.id}
                                className="pii__suggestion"
                                type="button"
                                onClick={() => applyManualMatch(row.pageNumber, p.id)}
                              >
                                {p.title}
                              </button>
                            ))}
                          </div>
                        )}

                        {row.status === 'COMPLETED' && (
                          <button
                            className="pii__button"
                            type="button"
                            onClick={() => revertPage(row.pageNumber)}
                          >
                            Revert this image
                          </button>
                        )}

                        {(row.status === 'FAILED' || row.status === 'NEEDS_REVIEW' || row.status === 'SKIPPED') && (
                          <button
                            className="pii__button"
                            type="button"
                            onClick={() => processOnePage(row.pageNumber)}
                          >
                            Retry this page
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
