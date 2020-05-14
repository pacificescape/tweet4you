module.exports = (w = '') => {
  return w.split('').map((c) => {
    switch (c) {
      case '&': return '&amp;'
      case '"': return '&quot;'
      case '\'': return '&#39;'
      case '<': return '&lt;'
      default : return c
    }
  }).join('')
}
