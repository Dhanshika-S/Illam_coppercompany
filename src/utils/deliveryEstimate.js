function addBusinessDays(date, businessDays) {
  const result = new Date(date)
  let addedDays = 0

  while (addedDays < businessDays) {
    result.setDate(result.getDate() + 1)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays += 1
    }
  }

  return result
}

function getEstimatedDeliveryRange(from = new Date()) {
  const earliest = addBusinessDays(from, 5)
  const latest = addBusinessDays(from, 7)
  const format = (date) => date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })

  return `${format(earliest)} – ${format(latest)}`
}

export { getEstimatedDeliveryRange }
