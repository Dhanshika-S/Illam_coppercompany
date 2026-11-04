import { useState } from 'react'
import { resolveProductImage } from '../utils/productImages.js'

const FALLBACK_IMAGE = '/product-image-fallback.svg'

function ProductImage({ image, alt, ...props }) {
  const [src, setSrc] = useState(() => resolveProductImage(image) || FALLBACK_IMAGE)

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onError={() => {
        if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

export default ProductImage
