/**
 * @requires: c
 *
 */

c = eval('c') //lsp
var s = { x: canvas.width, y: canvas.height }
var s2 = { x: s.x / 2, y: s.y / 2 }
const pythagoras = (x, y) => Math.sqrt(x ** 2 + y ** 2)

class Engine {
    constructor({ timeInterval, length, graphX, scale }) {
        this.vectors = []
        this.reference = null
        this.startX = graphX ?? -s2.x / 2
        this.timeInterval = timeInterval ?? 20
        this.length = length ?? s.x
        this.scale = scale ?? 1.5
        this.c = 20 
        this.c2 = this.c ** 2
    }

    newVector(o) {
        const v = new Vector(o)
        v.id = this.vectors.push(v) - 1, v.e = this
        this.updateVectors()
        return v
    }
    removeVector(v) {
        for (let i = 0; i < this.vectors.length; i++)
            if (this.vectors[i] == v) { this.vectors.splice(i, 1)[0], this.updateVectors(); break }
        for (let i = 0; i < this.vectors.length; i++) this.vectors[i].id = i 
    }
    clearVectors() { this.vectors = [], this.reference = null, this.updateVectors() }
    updateVectors() {
        this.onvectorupdate?.()
        const vectors = this.vectors.map(v => t => v.x(t) / this.c)
        for (let v of this.vectors) v.vectors = vectors
    }
    toString() { return `[${this.vectors.map(v => v.toString())}]` }

    update(_dt, speed) {
        const dt = _dt / this.timeInterval * speed
        for (let i = 0; i < this.vectors.length; i++) {
            const vector = this.vectors[i]
            if (vector != this.reference) {
                const v = Math.abs(vector.v() - this.reference.v()) / (1 + vector.v() * this.reference.v() / (this.c ** 2))
                const __dt = dt / Math.sqrt(1 - (v ** 2) / (this.c ** 2))
                vector.t += __dt
                vector.ts += __dt / 1000 * this.timeInterval
            }
            else { 
                vector.t += dt
                vector.ts += dt / 1000 * this.timeInterval
            }
        }
    }

    draw() {
        c.reset()
        c.translate(s2.x + this.startX, s2.y)
        c.scale(this.scale, this.scale)

        //{{{ relativistic grid 
        c.lineWidth = 1
        c.strokeStyle = '#343434'
        c.beginPath()
        for (let i = -s2.y; i <= s2.y; i += this.c) {
            c.moveTo(...this.rtransform(s2.x - this.startX, i))
            c.lineTo(...this.rtransform(-s2.x - this.startX, i))
        }

        for (let i = -s2.x; i <= s2.x; i += this.c) {
            c.moveTo(...this.rtransform(i - this.startX, s2.y))
            c.lineTo(...this.rtransform(i - this.startX, -s2.y))
        }
        c.stroke(); c.closePath()

        c.beginPath()
        c.moveTo(...this.rtransform(-100, -100))
        c.lineTo(...this.rtransform(100, 100))
        c.moveTo(...this.rtransform(100, -100))
        c.lineTo(...this.rtransform(-100, 100))
        c.stroke(); c.closePath()
        //}}}

        //{{{ axes 
        c.strokeStyle = '#666'
        c.beginPath()
        c.moveTo(...this.rtransform(0, -80))
        c.lineTo(...this.rtransform(0, 80))
        c.moveTo(...this.rtransform(80, 0))
        c.lineTo(...this.rtransform(-80, 0))
        c.stroke(); c.closePath()

        c.lineWidth = 1.5
        c.strokeStyle = '#777'
        c.beginPath()
        c.moveTo(-s2.x - this.startX, 0); c.lineTo(s2.x - this.startX, 0)
        c.moveTo(0, s2.y); c.lineTo(0, -s2.y)
        c.stroke(); c.closePath()
        
        c.textAlign = 'left'
        c.textBaseline = 'middle'
        c.fillStyle = '#666'
        c.fillText('x', ...this.rtransform(0, -80))
        c.fillText('t', ...this.rtransform(80, 0))
        c.fillStyle = '#888'
        c.font = '10px arial'
        c.fillText('x\'', 0, -80)
        c.fillText('t\'', 80, 0)
        //}}}


        c.lineWidth = 1
        for (let vector of this.vectors) {
            c.strokeStyle = c.fillStyle = vector.color
            c.beginPath()
            let less = true, dot = [], x, y
            for (let i = this.reference.t + this.startX - 100; i <= s.x + this.reference.t + this.startX + 10; i += 1 / 3) {
                [x, y] = this.rtransform(i - this.reference.t, (-vector.x(i) + this.reference.x()) / this.c)
                if (!less && x < 0) less = true, dot.push(y / this.c)
                if (less && x > 0) less = false, dot.push(y)
                c.lineTo(x, y)
            }
            if (!dot.length) dot = [y]
            c.stroke(); c.closePath()

            c.textAlign = 'center'
            dot.forEach(y => {
                c.beginPath()
                c.arc(0, y, 2, Math.PI, -Math.PI)
                c.fill()
                c.textBaseline = 'bottom'
                c.fillText(vector.id, 0, y - 3)
                c.textBaseline = 'top'
                c.fillText((isNaN(vector.ts) ? '0.0' : vector.ts.toFixed(1)) + 's', 0, y + 3)
            })
        }
    }

    //transform(x, t, v) { return [(x - t * v.v()) * v.y, (t - x * v.v()) * v.y] }

    rtransform(x, t) { return [(x - t * this.reference.v() / this.c) * this.reference.y, (t - x * this.reference.v() / this.c) * this.reference.y] }
}

class Vector {
    constructor({ x, color }, e) {
        this.t = 0; this.ts = 0
        this.xFunction(x)
        this.color = color ?? '#FF0000'
        this.e = e
    }
    v(t, p) { const d = p ?? 1 / 8, v = (this.x((t ?? this.t) - d) - this.x((t ?? this.t) + d)) / (2 * d); return Math.abs(v) > this.e.c ? Math.sign(v) * 0.999 : v }
    vr(t) { return (this.v() - this.e.reference.v()) / (1 + this.v() * this.e.reference.v() / this.e.c) }
    get y() { return 1 / Math.sqrt(1 - this.v() ** 2 / this.e.c2) }
    xFunction(x) { var xf = eval(`(function (t) { ${x} })`); this.x = t => xf.bind(this)(t ?? this.t) * this.e.c, this.xFuncionString = x }
    toString() { return JSON.stringify({ x: this.xFuncionString, color: this.color }) }
}

exports = Engine
