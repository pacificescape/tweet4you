module.exports = (link) => {
    let match = link.match(/twitter.com\/(.+)/)

    return match ? match[1] : null
}
