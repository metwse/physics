const simulations = [
    ['Yeşil Kare', '/simulations/test.html'],
    ['Newton 1', '/simulations/physics-v1.html']
]

const d = document, w = window
var w2

const cache = {}


const header = Object.fromEntries(['select', 'reload', 'debug', 'tools'].map(v => [v, d.querySelector(`body > header .toolbar .${v}`)]))
!['debug', 'tools'].forEach(v => {
    const target = d.getElementById(v)
    target.querySelector('.close').onclick = header[v].onclick = () => {
        target.classList.toggle('active')
        header[v].classList.toggle('active')
    }
    target.wrapper = target.querySelector('.wrapper')
    target.wrapper.attachShadow({ mode: 'open' })
    target.root = target.wrapper.shadowRoot
})
header.reload.onclick = () => {
    if (app.last === null) return
    app.loadURL(app.last)
}


for (let [i, simulation] of simulations.entries()) {
    let option = d.createElement('option')
    option.value = i, option.innerHTML = simulation[0]
    header.select.appendChild(option)
}
header.select.oninput = ({ target: { value } }) => { 
    if (header.select.children[0].className == 'placeholder') header.select.children[0].remove()
    app.loadURL(simulations[value][1])
}


const app = {
    random: null,

    requestAnimationFrameFunction(random) {
        return callback => { if (this.random == random) requestAnimationFrame(() => callback()) }
    },

    //TODO:: history & reload (loadURL > this.last)
    last: null,
    
    async loadURL(url) {
        var data = cache[url], elem = d.createElement('div'), random = Math.random()
        this.last = url
        this.random = random

        if (!data) data = cache[url] = await fetch(url).then(r => r.text())
        if (this.random != random) return
        elem.innerHTML = data

        var newCanvas = d.createElement('canvas')
        newCanvas.width = 800, newCanvas.height = 600
        canvas.replaceWith(newCanvas)
        canvas = newCanvas, ctx = canvas.getContext('2d')

        !['tools', 'debug'].forEach(v => { 
            var html = elem.querySelector(v)?.innerHTML ?? false
            header[v].style.display = w[v].style.display = html ? '' : 'none'
            w[v].root.innerHTML = html ? `<div class="root">${html}</div>` : '' 
        })

        w2 = newWindow()
        w2.ctx = ctx, w2.canvas = canvas
        w2.console = console, w2.frame = w2.requestAnimationFrame = this.requestAnimationFrameFunction(random)
        w2.tools = tools.root.children[0], w2.debug = debug.root.children[0]

        await Promise.all(
            Object.entries(eval(`() => { var v = {${elem.querySelector('script[requirements]')?.innerText ?? ''}}; return v }`)()).map(async ([key, value]) => {
                var script = cache[value]
                if (!script) script = cache[value] = await fetch(value).then(r => r.text())
                if (this.random == random) { 
                    w2.eval(`window['${key.replace(/'/g, '\'')}'] = (() => { ${script}; if (typeof exports == 'undefined') var exports = undefined; return exports })()`)
                    //TODO:: loading screen
                }
                return
            })
        )
        if (this.random != random) return

        w2.eval(elem.querySelector('script:not([requirements])')?.innerText ?? '')
    }
}

function newWindow() {
    var iframe = d.createElement('iframe')
    iframe.style.display = 'none', iframe.src = 'about:blank'
    d.body.appendChild(iframe)
    setTimeout(() => iframe.remove())
    return iframe.contentWindow 
}

onload = () => {
    w.canvas = d.querySelector('canvas')
    w.ctx = w.canvas.getContext('2d')
}
