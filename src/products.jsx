
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import './products.css'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'
import ProductImage from './components/ProductImage.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'
import { apiRequest } from './utils/api.js'
import { getEstimatedDeliveryRange } from './utils/deliveryEstimate.js'

import heroImg from './assets/herocollection.png'

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(price)
}

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cartError, setCartError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [addingProduct, setAddingProduct] = useState('')
  const [quantities, setQuantities] = useState({})
  const params = new URLSearchParams(window.location.search)

  const initialCategory = {
    kitchen: 'Kitchen & Dining',
    brass: 'Brass & Pooja',
    decor: 'Home Décor'
  }

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory[params.get('category')] || 'All'
  )

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  useEffect(() => {
    apiRequest('/products')
      .then(setProducts)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [])

  let filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      product.category === selectedCategory

    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku || product._id).toLowerCase().includes(search.toLowerCase())

    return matchesCategory && matchesSearch
  })

  if (sort === 'name-asc') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
  }

  if (sort === 'name-desc') {
    filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
  }

  if (sort === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price)
  }

  if (sort === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price)
  }

  const categories = [
    'All',
    'Kitchen & Dining',
    'Brass & Pooja',
    'Home Décor'
  ]

  async function addToCart(product) {
    const quantity = quantities[product._id] ?? 0
    if (quantity < 1) return

    setAddingProduct(product._id)
    setCartError('')
    setCartMessage('')
    try {
      const updatedCart = await apiRequest('/cart/add', {
        method: 'POST',
        body: { productId: product._id, quantity },
      })
      setCartMessage(`${quantity} × ${product.name} added to your cart.`)
      window.dispatchEvent(new CustomEvent('illam:cart-updated', {
        detail: { itemCount: updatedCart.itemCount },
      }))
      await new Promise((resolve) => window.setTimeout(resolve, 500))
      window.location.assign('/cart.html')
    } catch (error) {
      setCartError(error.message)
    } finally {
      setAddingProduct('')
    }
  }

  return (
    <div className="products-page">
      <SiteHeader />

      <section
        className="products-banner"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(37, 24, 15, 0.85),
              rgba(37, 24, 15, 0.35)
            ),
            url(${heroImg})
          `
        }}
      >
        <p>THE ART OF TRADITIONAL LIVING</p>
        <h1>Discover Our Collections</h1>
        <span>Explore timeless pieces inspired by Tamil heritage.</span>
      </section>

      <section className="products-section">

        <div className="products-heading">
          <div>
            <p>CURATED FOR YOUR HOME</p>
            <h2>Our Products</h2>
          </div>
          <span>{filteredProducts.length} Products</span>
        </div>

        <div className="product-controls">

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  selectedCategory === category
                    ? 'category-button active'
                    : 'category-button'
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="search-sort">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Sort By</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

        </div>

        <div className="product-grid">
          {loading ? (
            <p role="status">Loading products...</p>
          ) : loadError ? (
            <div className="no-products" role="alert">
              <h3>Products could not be loaded</h3>
              <p>{loadError}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products" role="status">
              <h3>No products are currently available</h3>
              <p>The catalog has no products to display right now.</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div className="product-card" key={product._id}>

                <div className="product-image">
                  <ProductImage image={product.image} alt={product.name} />
                </div>

                <div className="product-details">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="product-id">
                    Product ID: {product.sku || product._id}
                  </p>

                  <p className="product-description">
                    {product.description}
                  </p>
                  <p className="product-delivery">
                    Expected delivery: {getEstimatedDeliveryRange()}
                  </p>

                  <div className="product-bottom">
                    <h4>{formatPrice(product.price)}</h4>

                    <div className="product-purchase">
                      <div className="product-quantity" aria-label={`Quantity for ${product.name}`}>
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name} quantity`}
                          disabled={(quantities[product._id] ?? 0) <= 0}
                          onClick={() => setQuantities((current) => ({
                            ...current,
                            [product._id]: Math.max(0, (current[product._id] ?? 0) - 1),
                          }))}
                        >−</button>
                        <span>{quantities[product._id] ?? 0}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name} quantity`}
                          disabled={(quantities[product._id] ?? 0) >= product.stock}
                          onClick={() => setQuantities((current) => ({
                            ...current,
                            [product._id]: Math.min(
                              product.stock,
                              (current[product._id] ?? 0) + 1,
                            ),
                          }))}
                        >+</button>
                      </div>
                      <button
                        disabled={
                          (quantities[product._id] ?? 0) < 1 ||
                          product.stock < 1 ||
                          addingProduct === product._id
                        }
                        onClick={() => addToCart(product)}
                      >
                        {product.stock < 1
                          ? 'Out of Stock'
                          : addingProduct === product._id
                            ? 'Adding...'
                            : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try another search or category.</p>
            </div>
          )}
        </div>
        {cartError && <p className="no-products" role="alert">{cartError}</p>}
        {cartMessage && <p className="cart-success" role="status">{cartMessage}</p>}

      </section>

      <SiteFooter />

    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProtectedApp>
      <Products />
    </ProtectedApp>
  </StrictMode>
)
