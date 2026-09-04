'use client'

import React, { useEffect, useRef, useState } from 'react'

type CustomerSuggestion = {
  id: number | string
  name?: string | null
  email?: string | null
  phone?: string | null
}

type FulfillmentEvent = {
  id?: string | null
  status: string
  timestamp?: string | null
  note?: string | null
}

type OrderSuggestion = {
  id: number | string
  customer?: (number | string) | null
  customerEmail?: string | null
  status?: string | null
  currentFulfillmentStatus?: string | null
  amount?: number | null
  currency?: string | null
  createdAt?: string
  shippingAddress?: {
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  } | null
}

type OrderDetail = OrderSuggestion & {
  items?:
    | {
        product?: { title?: string | null } | number | null
        quantity: number
      }[]
    | null
  fulfillmentEvents?: FulfillmentEvent[] | null
}

const FULFILLMENT_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  collected: 'Collected In-Store',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const fulfillmentLabel = (status?: string | null) =>
  (status && FULFILLMENT_LABELS[status]) || status || 'Order Placed'

type CustomerDetail = {
  id: number | string
  name?: string | null
  email?: string | null
  phone?: string | null
  createdAt?: string
}

type AddressDetail = {
  id: number | string
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}

// Order amounts are stored in the currency's smallest unit (paise for INR), matching the
// ecommerce plugin's own formatCurrency convention — divide by 100 before display.
const formatMoney = (amount?: number | null, currency?: string | null) => {
  if (typeof amount !== 'number') return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      currency: currency || 'INR',
      style: 'currency',
      maximumFractionDigits: 0,
    }).format(amount / 100)
  } catch {
    return `${amount / 100}`
  }
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const orderCustomerLabel = (order: OrderSuggestion) => {
  const first = order.shippingAddress?.firstName
  const last = order.shippingAddress?.lastName
  const name = [first, last].filter(Boolean).join(' ')
  return name || order.customerEmail || 'Guest'
}

export const CustomerSearchPanel: React.FC = () => {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([])
  const [orders, setOrders] = useState<OrderSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)
  const [addresses, setAddresses] = useState<AddressDetail[]>([])
  const [customerOrders, setCustomerOrders] = useState<OrderDetail[]>([])
  const [selectedGuestOrder, setSelectedGuestOrder] = useState<OrderDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const requestIdRef = useRef(0)

  useEffect(() => {
    const q = query.trim()

    if (q.length < 2) {
      setCustomers([])
      setOrders([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const currentRequestId = ++requestIdRef.current
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customer-search?q=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = await res.json()
        if (currentRequestId === requestIdRef.current) {
          setCustomers(data.customers || [])
          setOrders(data.orders || [])
          setSearchError(null)
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setSearchError('Could not load results. Please try again.')
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false)
        }
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  async function loadCustomer(id: number | string) {
    setIsLoadingDetail(true)
    setSelectedGuestOrder(null)
    try {
      const res = await fetch(`/api/customer-search/${id}`)
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setSelectedCustomer(data.customer)
      setAddresses(data.addresses || [])
      setCustomerOrders(data.orders || [])
    } catch {
      setSearchError('Could not load that customer. Please try again.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  function selectOrder(order: OrderSuggestion) {
    if (order.customer) {
      loadCustomer(order.customer)
    } else {
      setSelectedCustomer(null)
      setAddresses([])
      setCustomerOrders([])
      setSelectedGuestOrder(order as OrderDetail)
    }
  }

  const hasResults = customers.length > 0 || orders.length > 0

  return (
    <div className="customer-search">
      <input
        autoFocus
        className="customer-search__input"
        placeholder="Search name, phone, email, or order number…"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isSearching && <p className="customer-search__status">Searching…</p>}
      {searchError && <p className="customer-search__status">{searchError}</p>}
      {!isSearching && query.trim().length >= 2 && !hasResults && !searchError && (
        <p className="customer-search__status">No customers or orders match &quot;{query.trim()}&quot;.</p>
      )}

      {customers.length > 0 && (
        <div>
          <p className="customer-search__group-label">Customers</p>
          <div className="customer-search__results">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={`customer-search__result${
                  selectedCustomer?.id === customer.id ? ' customer-search__result--active' : ''
                }`}
                onClick={() => loadCustomer(customer.id)}
              >
                <span>
                  <span className="customer-search__result-name">{customer.name || 'Unnamed customer'}</span>
                  <br />
                  <span className="customer-search__result-meta">
                    {[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <p className="customer-search__group-label">Orders</p>
          <div className="customer-search__results">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                className="customer-search__result"
                onClick={() => selectOrder(order)}
              >
                <span>
                  <span className="customer-search__result-name">Order #{order.id}</span>
                  <br />
                  <span className="customer-search__result-meta">
                    {orderCustomerLabel(order)} · {formatDate(order.createdAt)}
                  </span>
                </span>
                <span className="customer-search__result-status">
                  {fulfillmentLabel(order.currentFulfillmentStatus)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoadingDetail && <p className="customer-search__status">Loading customer…</p>}

      {selectedCustomer && !isLoadingDetail && (
        <div className="customer-detail">
          <div className="customer-detail__header">
            <div>
              <p className="customer-detail__field-label">Name</p>
              <p className="customer-detail__field-value">{selectedCustomer.name || '—'}</p>
            </div>
            <div>
              <p className="customer-detail__field-label">Email</p>
              <p className="customer-detail__field-value">{selectedCustomer.email || '—'}</p>
            </div>
            <div>
              <p className="customer-detail__field-label">Phone</p>
              <p className="customer-detail__field-value">{selectedCustomer.phone || '—'}</p>
            </div>
            <div>
              <p className="customer-detail__field-label">Customer since</p>
              <p className="customer-detail__field-value">{formatDate(selectedCustomer.createdAt)}</p>
            </div>
          </div>

          {addresses.length > 0 && (
            <>
              <p className="customer-detail__section-title">Saved addresses</p>
              {addresses.map((address) => (
                <p key={address.id} className="customer-order__address">
                  {[
                    address.addressLine1,
                    address.addressLine2,
                    address.city,
                    address.state,
                    address.postalCode,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              ))}
            </>
          )}

          <p className="customer-detail__section-title">
            Order history ({customerOrders.length})
          </p>
          {customerOrders.length === 0 && <p className="customer-search__status">No orders yet.</p>}
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {selectedGuestOrder && !isLoadingDetail && (
        <div className="customer-detail">
          <p className="customer-detail__section-title">Guest order — no account on file</p>
          <OrderCard order={selectedGuestOrder} />
        </div>
      )}
    </div>
  )
}

const OrderCard: React.FC<{ order: OrderDetail }> = ({ order }) => {
  return (
    <div className="customer-order">
      <div className="customer-order__header">
        <strong>Order #{order.id}</strong>
        <span className="customer-search__result-status">
          {fulfillmentLabel(order.currentFulfillmentStatus)}
        </span>
        <span>{formatMoney(order.amount, order.currency)}</span>
        <span className="customer-search__result-meta">{formatDate(order.createdAt)}</span>
      </div>

      {order.fulfillmentEvents && order.fulfillmentEvents.length > 0 && (
        <ul className="customer-order__items">
          {[...order.fulfillmentEvents]
            .sort(
              (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
            )
            .map((event, i) => (
              <li key={event.id || i}>
                {fulfillmentLabel(event.status)}
                {event.timestamp ? ` — ${formatDate(event.timestamp)}` : ''}
                {event.note ? ` (${event.note})` : ''}
              </li>
            ))}
        </ul>
      )}

      {order.items && order.items.length > 0 && (
        <ul className="customer-order__items">
          {order.items.map((item, i) => (
            <li key={i}>
              {typeof item.product === 'object' && item.product?.title
                ? item.product.title
                : 'Product'}{' '}
              × {item.quantity}
            </li>
          ))}
        </ul>
      )}

      {order.shippingAddress && (
        <p className="customer-order__address">
          Shipped to: {[order.shippingAddress.firstName, order.shippingAddress.lastName]
            .filter(Boolean)
            .join(' ')}
          {order.shippingAddress.phone ? ` · ${order.shippingAddress.phone}` : ''}
        </p>
      )}
    </div>
  )
}
