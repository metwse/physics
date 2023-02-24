const simulations = [
    ['Yeşil Kare', '/simulations/test.html'],
    ['Newton 1', '/simulations/physics-v1.html']
]


const d = document, w = window
var w2, iframe

const cache = {}
const template = d.querySelector('template.simulation')
const loading =  d.getElementById('loading')




//{{{ HEADER nav 
const header = Object.fromEntries(['select', 'reload', 'debug', 'tools'].map(v => [v, d.querySelector(`body > header .toolbar .${v}`)]))
!['debug', 'tools'].forEach(v => {
    header[v].onclick = () => {
        w2?.[v].parentNode.classList.toggle?.('active')
        header[v].classList.toggle('active')
    }
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
//}}}




const app = {
    random: null,

    requestAnimationFrameFunction(random) {
        return callback => { if (this.random == random) requestAnimationFrame(() => callback()) }
    },

    //TO DO:: history & reload (loadURL > this.last)
    last: null,
    
    async loadURL(url) {
        var data = cache[url], elem = d.createElement('div'), random = Math.random()
        this.last = url
        this.random = random
        loading.style.display = 'flex'

        if (!data) data = cache[url] = await fetch(url).then(r => r.text())
        if (this.random != random) return
        elem.innerHTML = data

        var newIframe = d.createElement('iframe')
        iframe.replaceWith(newIframe)
        iframe = newIframe
         
        w2 = iframe.contentWindow
        w2.d = w2.document, w2.w = w2
        //TO DO:: better animation manager
        w2.console = console, w2.frame = w2.requestAnimationFrame = this.requestAnimationFrameFunction(random)

        for (let [i, v] of ['head', 'body'].entries()) w2.d[v].innerHTML = template.content.children[i].innerHTML
    
        //TO DO:: improve perf
        await new Promise(res => w2.onload = res)
        /* onload */ w2.canvas = w2.d.querySelector('canvas')
        /* onload */ w2.ctx = w2.canvas.getContext('2d')

        !['tools', 'debug'].forEach(v => { 
            let html = elem.querySelector(v)?.innerHTML ?? false

            w2[v] = w2.d.getElementById(v)
            if (header[v].classList.contains('active')) w2[v].classList.add('active')
            w2[v].querySelector('.title .close').onclick = header[v].onclick
            header[v].style.display = w2[v].style.display = html ? '' : 'none'

            w2[v].root = w2[v].querySelector('.wrapper').attachShadow({ mode: 'open' })
            w2[v].root.innerHTML = html ? `<div class="root">${html}</div>` : ''
            w2[v] = w2[v].children[0]
        })
        
        await Promise.all(
            Object.entries(eval(`() => { var v = {${elem.querySelector('script[requirements]')?.innerText ?? ''}}; return v }`)()).map(async ([key, value]) => {
                var script = cache[value]; if (!script) script = cache[value] = await fetch(value).then(r => r.text())
                if (this.random == random) { 
                    w2.eval(`window['${key.replace(/'/g, '\'')}'] = (() => { ${script}; if (typeof exports == 'undefined') var exports = undefined; return exports })()`)
                    //TO DO:: better loading screen
                }
                return
            })
        )
        if (this.random != random) return

        loading.style.display = ''
        w2.eval(elem.querySelector('script:not([requirements])')?.innerText ?? '')
    }
}




onload = () => {
    iframe = d.querySelector('iframe')
}
