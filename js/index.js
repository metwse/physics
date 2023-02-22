const simulations = [
   ['Newton 1', '/simulations/physics_v1-0-0.html']
]

const d = document, w = window


const cache = {}


const header = Object.fromEntries(['select', 'reload', 'debug', 'tools'].map(v => [v, d.querySelector(`body > header .toolbar button.${v}`)]))
!['debug', 'tools'].forEach(v => {
    const target = d.getElementById(v)
    header[v].onclick = () => {
        target.classList.toggle('active')
        header[v].classList.toggle('active')
    }
})

const app = {
    async loadURL(url) {
        var data = cache[url], elem = d.createElement('div')
        if (!data) data = cache[url] = await fetch(url).then(r => r.text())
        elem.innerHTML = data

        var requirements = Object.fromEntries(await Promise.all(
            Object.entries(eval(`() => { var v = {${elem.querySelector('script[requirements]')?.innerText ?? ''}}; return v }`)()).map(async ([key, value]) => {
                var script = cache[value]
                if (!script) script = cache[value] = await fetch(value).then(r => r.text())
                return [key, eval(`() => { ${script}; if (typeof exports == 'undefined') var exports = undefined; return exports }`)()]
            })
        ))
        
        new Function(`{ ${Object.keys(requirements)} }`, elem.querySelector('script:not([requirements])')?.innerText ?? '')(requirements)
    }
}


onload = () => {
    w.canvas = d.querySelector('canvas')
    w.ctx = w.canvas.getContext('2d')
    
}
