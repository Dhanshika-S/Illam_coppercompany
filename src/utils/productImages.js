import kadaiImg from '../assets/kadai.png'
import tiffinImg from '../assets/tiffin.png'
import coffeeImg from '../assets/coffee.png'
import kitchenImg from '../assets/kitchen.png'
import brassImg from '../assets/brass.png'
import decorImg from '../assets/decor.png'
import product4Img from '../assets/product4.png'
import product5Img from '../assets/product5.png'
import product6Img from '../assets/product6.png'
import product7Img from '../assets/product7.png'
import product8Img from '../assets/product8.png'
import product9Img from '../assets/product9.png'

const productImages = {
  'kadai.png': kadaiImg,
  'tiffin.png': tiffinImg,
  'coffee.png': coffeeImg,
  'kitchen.png': kitchenImg,
  'brass.png': brassImg,
  'decor.png': decorImg,
  'product4.png': product4Img,
  'product5.png': product5Img,
  'product6.png': product6Img,
  'product7.png': product7Img,
  'product8.png': product8Img,
  'product9.png': product9Img,
}

function resolveProductImage(image) {
  if (typeof image !== 'string' || image.trim() === '') return ''
  const imagePath = image.trim()
  if (/^(https?:|data:|blob:)/i.test(imagePath)) return imagePath

  const filename = imagePath.split(/[\\/]/).pop()?.split(/[?#]/)[0]?.toLowerCase()
  if (filename && productImages[filename]) return productImages[filename]
  if (imagePath.startsWith('/')) return imagePath
  return ''
}

export { resolveProductImage }
