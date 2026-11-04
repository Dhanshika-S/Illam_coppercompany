
import './App.css'
import './pages/story.css'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'

import heroImg from './assets/hero.png'
import kitchenImg from './assets/kitchen.png'
import brassImg from './assets/brass.png'
import decorImg from './assets/decor.png'

function App() {
  return (
    <>
      <SiteHeader showShopButton />

      <section
        className="hero"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(37, 24, 15, 0.85),
              rgba(37, 24, 15, 0.25)
            ),
            url(${heroImg})
          `
        }}
      >
        <div className="hero-content">
          <p className="subtitle">THE ART OF TRADITIONAL LIVING</p>

          <h1>Tradition Lives Here.</h1>

          <p className="description">
            Bring home the beauty of Tamil heritage
            with timeless pieces crafted for your home.
          </p>

          <button className="explore-button">
            Explore Collections
          </button>
        </div>
      </section>

      <section className="collections">

        <div className="section-heading">
          <p>CURATED FOR YOUR HOME</p>
          <h2>Explore Our Collections</h2>
          <span>Discover the beauty of traditional living.</span>
        </div>

        <div className="collection-container">

          <div className="collection-card">
            <img src={kitchenImg} alt="Traditional kitchen vessels" />

            <div className="card-content">
              <h3>Kitchen & Dining</h3>
              <p>Make every meal special.</p>
              <a href="/products.html?category=kitchen">
                Explore Collection →
              </a>
            </div>
          </div>

          <div className="collection-card">
            <img src={brassImg} alt="Traditional brass pooja items" />

            <div className="card-content">
              <h3>Brass & Pooja</h3>
              <p>Bring home timeless traditions.</p>
              <a href="/products.html?category=brass">
                Explore Collection →
              </a>
            </div>
          </div>

          <div className="collection-card">
            <img src={decorImg} alt="Traditional wooden home decor" />

            <div className="card-content">
              <h3>Home Décor</h3>
              <p>Elegance in every corner.</p>
              <a href="/products.html?category=decor">
                Explore Collection →
              </a>
            </div>
          </div>

        </div>
      </section>

      <section id="our-story" className="story-page story-craft story-section">
        <div className="story-craft-copy">
          <p className="story-eyebrow">OUR STORY</p>
          <h2>Tradition belongs in every home.</h2>
          <p>
            Illam — meaning “home” — brings together traditional kitchenware,
            brass and pooja essentials, and home décor inspired by Indian
            living.
          </p>
          <p>
            We celebrate the familiar rituals, thoughtful craftsmanship and
            cultural details that make a house feel like home.
          </p>
          <a className="story-button" href="/products.html">
            Explore Collections
          </a>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

export default App
