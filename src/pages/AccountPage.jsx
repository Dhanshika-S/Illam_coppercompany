import { useEffect, useState } from 'react'
import { SiteFooter, SiteHeader } from '../components/SiteLayout.jsx'
import { clearDemoUser, getDemoUser } from '../utils/demoAuth.js'
import { apiRequest } from '../utils/api.js'
import './account.css'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

function AccountPage() {
  const [session] = useState(getDemoUser)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      window.location.replace('/login.html')
      return
    }
    apiRequest('/orders/my-orders')
      .then(setOrders)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingOrders(false))
  }, [session])

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (requestError) {
      console.error('Unable to end the server session:', requestError)
    } finally {
      clearDemoUser()
      window.location.assign('/login.html')
    }
  }

  return (
    <div className="account-page">
      <SiteHeader />
      <main className="account-main">
        {session ? (
          <>
            <section className="account-card">
              <p className="account-eyebrow">YOUR ILLAM ACCOUNT</p>
              <h1>Welcome, {session.user.fullName}</h1>
              <p className="account-description">
                Your profile and order history are linked to your Illam account.
              </p>
              <dl>
                <div><dt>Name</dt><dd>{session.user.fullName}</dd></div>
                <div><dt>Email</dt><dd>{session.user.email}</dd></div>
              </dl>
              <button className="account-logout" type="button" onClick={logout}>Logout</button>
            </section>

            <section className="account-orders">
              <div className="account-orders-heading">
                <div>
                  <p className="account-eyebrow">YOUR PURCHASES</p>
                  <h2>Order History</h2>
                </div>
                <a href="/products.html">Continue Shopping</a>
              </div>
              {error && <p className="account-error" role="alert">{error}</p>}
              {loadingOrders ? (
                <p className="account-description" role="status">Loading your orders...</p>
              ) : orders.length === 0 ? (
                <p className="account-description">You have not placed any orders yet.</p>
              ) : (
                <div className="account-order-list">
                  {orders.map((order) => (
                    <article className="account-order" key={order.orderId}>
                      <div className="account-order-heading">
                        <div>
                          <span>Order ID</span>
                          <strong>{order.orderId}</strong>
                        </div>
                        <div>
                          <span>Order Date</span>
                          <strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>{order.status}</strong>
                        </div>
                        <div>
                          <span>Total</span>
                          <strong>{money(order.total)}</strong>
                        </div>
                      </div>
                      <ul>
                        {order.items.map((item) => (
                          <li key={`${order.orderId}-${item.product}`}>
                            {item.name} — Qty {item.quantity} — {money(item.subtotal)}
                          </li>
                        ))}
                      </ul>
                      <a
                        className="account-invoice-link"
                        href={`/invoice.html?id=${encodeURIComponent(order.orderId)}`}
                      >
                        View Invoice
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <p className="account-redirect-message">
            You are not logged in. Redirecting to Login...
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

export default AccountPage
