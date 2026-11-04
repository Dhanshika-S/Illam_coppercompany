import { StrictMode, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'
import ProductImage from './components/ProductImage.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'
import { apiRequest } from './utils/api.js'
import { getEstimatedDeliveryRange } from './utils/deliveryEstimate.js'
import { getDemoUser } from './utils/demoAuth.js'
import './commerce.css'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

function CartPage() {
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    productCount: 0,
    subtotal: 0,
    deliveryCharge: 0,
    total: 0,
  })
  const [sort, setSort] = useState('name-asc')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadCart = useCallback(async () => {
    try {
      const currentCart = await apiRequest('/cart')
      setCart(currentCart)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getDemoUser()) {
      window.location.replace('/login.html')
      return
    }
    loadCart()
  }, [loadCart])

  const displayItems = [...cart.items]
  if (sort === 'name-asc') {
    displayItems.sort((left, right) => left.product.name.localeCompare(right.product.name))
  } else if (sort === 'name-desc') {
    displayItems.sort((left, right) => right.product.name.localeCompare(left.product.name))
  } else {
    displayItems.sort((left, right) => {
      if (!left.addedAt) return right.addedAt ? 1 : 0
      if (!right.addedAt) return -1
      const difference = new Date(left.addedAt) - new Date(right.addedAt)
      return sort === 'oldest' ? difference : -difference
    })
  }

  async function updateQuantity(productId, quantity) {
    setBusy(true)
    setError('')
    try {
      const updatedCart = await apiRequest(`/cart/items/${productId}`, {
        method: 'PUT',
        body: { quantity },
      })
      setCart(updatedCart)
      window.dispatchEvent(new CustomEvent('illam:cart-updated', {
        detail: { itemCount: updatedCart.itemCount },
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeItem(productId) {
    setBusy(true)
    setError('')
    try {
      const updatedCart = await apiRequest(`/cart/items/${productId}`, { method: 'DELETE' })
      setCart(updatedCart)
      window.dispatchEvent(new CustomEvent('illam:cart-updated', {
        detail: { itemCount: updatedCart.itemCount },
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function clearCart() {
    setBusy(true)
    setError('')
    try {
      const updatedCart = await apiRequest('/cart/clear', { method: 'DELETE' })
      setCart(updatedCart)
      window.dispatchEvent(new CustomEvent('illam:cart-updated', {
        detail: { itemCount: updatedCart.itemCount },
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="commerce-page">
      <SiteHeader />
      <main className="commerce-main">
        <div className="commerce-heading">
          <p className="commerce-eyebrow">YOUR SELECTION</p>
          <h1>Shopping Cart</h1>
        </div>

        {error && <p className="commerce-alert" role="alert">{error}</p>}
        {loading ? (
          <p role="status">Loading your cart...</p>
        ) : cart.items.length === 0 ? (
          <section className="commerce-empty">
            <h2>Your cart is empty</h2>
            <p>Explore our collections and add something special to your home.</p>
            <a className="commerce-primary" href="/products.html">Continue Shopping</a>
          </section>
        ) : (
          <div className="commerce-layout">
            <section className="commerce-card commerce-cart-list">
              <div className="commerce-cart-toolbar">
                <label>
                  Sort cart by
                  <select value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="name-asc">Product name: A to Z</option>
                    <option value="name-desc">Product name: Z to A</option>
                    <option value="oldest">Date added: Oldest first</option>
                    <option value="newest">Date added: Newest first</option>
                  </select>
                </label>
                <button className="commerce-text-button" type="button" disabled={busy} onClick={clearCart}>
                  Clear Cart
                </button>
              </div>

              {displayItems.map((item) => (
                <article className="commerce-cart-item" key={item.product._id}>
                  <ProductImage
                    className="commerce-product-image"
                    image={item.product.image}
                    alt={item.product.name}
                  />
                  <div className="commerce-item-info">
                    <span>{item.product.category}</span>
                    <h2>{item.product.name}</h2>
                    <p>Product ID: {item.product.sku || item.product._id}</p>
                    <p>Unit price: {money(item.product.price)}</p>
                    <p>Expected delivery: {getEstimatedDeliveryRange()}</p>
                    <p>
                      Added: {item.addedAt
                        ? new Date(item.addedAt).toLocaleDateString('en-IN')
                        : 'Date unavailable'}
                    </p>
                    <p>Quantity: <strong>{item.quantity}</strong></p>
                    <p>Subtotal: <strong>{money(item.subtotal)}</strong></p>
                    <div className="commerce-item-actions">
                      <div className="commerce-quantity" aria-label={`Quantity for ${item.product.name}`}>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={busy || item.quantity <= 1}
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        >−</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={busy || item.quantity >= item.product.stock}
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button
                        className="commerce-text-button"
                        type="button"
                        disabled={busy}
                        onClick={() => removeItem(item.product._id)}
                      >Remove Product</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="commerce-card commerce-summary">
              <h2>Order Summary</h2>
              <p><span>Different products</span><strong>{cart.productCount}</strong></p>
              <p><span>Total quantity</span><strong>{cart.itemCount}</strong></p>
              <div className="commerce-summary-lines">
                {cart.items.map((item) => (
                  <p key={item.product._id}>
                    <span>
                      {item.product.name}<br />
                      {money(item.product.price)} × {item.quantity}
                    </span>
                    <strong>{money(item.subtotal)}</strong>
                  </p>
                ))}
              </div>
              <p><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></p>
              <p><span>Delivery</span><strong>{money(cart.deliveryCharge)}</strong></p>
              <p className="commerce-total"><span>Grand Total</span><strong>{money(cart.total)}</strong></p>
              <a className="commerce-primary" href="/checkout.html">Proceed to Checkout</a>
              <a className="commerce-secondary" href="/products.html">Continue Shopping</a>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><ProtectedApp><CartPage /></ProtectedApp></StrictMode>,
)
