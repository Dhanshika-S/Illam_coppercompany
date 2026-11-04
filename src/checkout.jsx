import { StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'
import { apiRequest } from './utils/api.js'
import { getDemoUser } from './utils/demoAuth.js'
import { resolveProductImage } from './utils/productImages.js'
import './commerce.css'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

const emptyCustomer = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
}

function CheckoutPage() {
  const [session] = useState(getDemoUser)
  const [customer, setCustomer] = useState({
    ...emptyCustomer,
    fullName: session?.user?.fullName || '',
    email: session?.user?.email || '',
  })
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 })
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const idempotencyKey = useRef(crypto.randomUUID())

  const loadCart = useCallback(async () => {
    try {
      const currentCart = await apiRequest('/cart')
      setCart(currentCart)
      if (currentCart.items.length === 0) {
        setError('Your cart is empty. Add products before checkout.')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!session) {
      window.location.replace('/login.html')
      return
    }
    loadCart()
  }, [loadCart, session])

  function updateField(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function placeOrder(event) {
    event.preventDefault()
    setError('')
    setPlacing(true)
    try {
      const order = await apiRequest('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.current },
        body: { customer },
      })
      window.dispatchEvent(new Event('illam:cart-updated'))
      window.location.assign(`/confirmation.html?id=${encodeURIComponent(order.orderId)}`)
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.message === 'Your cart is empty.') {
        await loadCart()
      }
    } finally {
      setPlacing(false)
    }
  }

  const fields = [
    { name: 'fullName', label: 'Customer Full Name', type: 'text', autoComplete: 'name' },
    { name: 'email', label: 'Email Address', type: 'email', autoComplete: 'email' },
    { name: 'phone', label: 'Mobile Number', type: 'tel', autoComplete: 'tel' },
    { name: 'address', label: 'House / Street Address', type: 'text', autoComplete: 'street-address' },
    { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2' },
    { name: 'state', label: 'State', type: 'text', autoComplete: 'address-level1' },
    { name: 'pinCode', label: 'PIN Code', type: 'text', autoComplete: 'postal-code', inputMode: 'numeric' },
  ]

  return (
    <div className="commerce-page">
      <SiteHeader />
      <main className="commerce-main">
        <div className="commerce-heading">
          <p className="commerce-eyebrow">DELIVERY DETAILS</p>
          <h1>Checkout</h1>
        </div>
        {error && <p className="commerce-alert" role="alert">{error}</p>}
        {loading ? (
          <p role="status">Loading checkout...</p>
        ) : (
          <div className="commerce-layout">
            <form className="commerce-card commerce-checkout-form" onSubmit={placeOrder}>
              <h2>Customer & Delivery Information</h2>
              <div className="commerce-form-grid">
                {fields.map((field) => (
                  <label key={field.name} className={field.name === 'address' ? 'commerce-wide' : ''}>
                    {field.label}
                    <input
                      name={field.name}
                      type={field.type}
                      inputMode={field.inputMode}
                      autoComplete={field.autoComplete}
                      value={customer[field.name]}
                      onChange={updateField}
                      required
                      maxLength={field.name === 'address' ? 240 : 120}
                    />
                  </label>
                ))}
              </div>
              <p className="commerce-payment-note">
                This places an order only. Online payment is not available at this time.
              </p>
              <button
                className="commerce-primary"
                type="submit"
                disabled={placing || cart.items.length === 0}
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>

            <aside className="commerce-card commerce-summary">
              <h2>Order Summary</h2>
              {cart.items.map((item) => (
                <div className="commerce-checkout-item" key={item.product._id}>
                  <img src={resolveProductImage(item.product.image)} alt="" />
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.quantity} × {money(item.product.price)}</span>
                    <b>{money(item.subtotal)}</b>
                  </div>
                </div>
              ))}
              <p><span>Items ({cart.itemCount})</span><strong>{money(cart.subtotal)}</strong></p>
              <p><span>Shipping</span><strong>₹0.00</strong></p>
              <p className="commerce-total"><span>Total</span><strong>{money(cart.subtotal)}</strong></p>
              <small>Taxes are not included. No payment is collected online.</small>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><ProtectedApp><CheckoutPage /></ProtectedApp></StrictMode>,
)
