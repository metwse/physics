/**
 * @requires: c
 *
 */

c = eval('c') //lsp
var s = { x: canvas.width, y: canvas.height }
var s2 = { x: s.x / 2, y: s.y / 2 }
const pythagoras = (x, y) => Math.sqrt(x ** 2 + y ** 2)

class Engine {
    constructor({ timeInterval, length, graphX }) {
        this.vectors = []
        this.reference = null
        this.startX = graphX ?? -s2.x / 2
        this.timeInterval = timeInterval ?? 20
        this.length = length ?? s.x
    }

    newVector(o) {
        const v = new Vector(o); this.vectors.push(v)
        this.onvectorupdate?.()
        return v
    }
    removeVector(v) {
        for (let i = 0; i < this.vectors.length; i++)
            if (this.vectors[i] == v) { this.vectors.splice(i, 1)[0], this.onvectorupdate?.(); return }
    }

    update(_dt) {
        const dt = _dt / this.timeInterval
        for (let i = 0; i < this.vectors.length; i++) {
            const vector = this.vectors[i]
            const __dt = dt / vector.y * this.reference.y
            vector.t += __dt
            vector.ts += __dt / 1000 * this.timeInterval
            vector.id = i
        }
    }

    draw() {
        c.reset()
        c.translate(s2.x + this.startX, s2.y)
        c.scale(1.5, 1.5)
        this.tscale = 1
        const k = 1 / Math.sqrt(pythagoras(...this.rtransform(1, 1)) * pythagoras(...this.rtransform(1, -1)))
        this.tscale = k
        if (isNaN(this.tscale)) this.tscale = 1

        const xoffset = 0

        c.lineWidth = 1
        c.strokeStyle = '#343434'
        for (let i = -s2.y; i <= s2.y; i += 20) {
            c.beginPath()
            c.moveTo(...this.rtransform(s2.x - this.startX + xoffset, i))
            c.lineTo(...this.rtransform(-s2.x - this.startX + xoffset, i))
            c.stroke(); c.closePath()
        }

        for (let i = -s2.x; i <= s2.x; i += 20) {
            c.beginPath()
            c.moveTo(...this.rtransform(i - this.startX + xoffset, s2.y))
            c.lineTo(...this.rtransform(i - this.startX + xoffset, -s2.y))
            c.stroke(); c.closePath()
        }
        c.beginPath()
        c.moveTo(0, 0)
        c.lineTo(...this.rtransform(100, 100))
        c.stroke(); c.closePath()

        c.lineWidth = 1.5
        c.strokeStyle = '#444444'
        c.beginPath()
        c.moveTo(-s2.x - this.startX, 0)
        c.lineTo(s2.x - this.startX, 0)
        c.stroke(); c.closePath()
        c.beginPath()
        c.moveTo(0, s2.y)
        c.lineTo(0, -s2.y)
        c.stroke(); c.closePath()

        c.lineWidth = 1
        for (let vector of this.vectors) {
            c.strokeStyle = c.fillStyle = vector.color
            c.beginPath()
            let less = true, dot, x, y
            for (let i = 0; i <= this.length; i += 1 / 3) {
                [x, y] = this.rtransform(i - this.reference.t, -vector.x(i) + this.reference.x())
                if (less && x > 0) less = false, dot = y
                c.lineTo(x, y)
            }
            if (dot === undefined) dot = y
            c.stroke(); c.closePath()

            c.beginPath()
            c.arc(0, dot, 2, Math.PI, -Math.PI)
            c.fill()
            c.fillText(vector.id, 2, dot - 2)
        }
    }

    transform(x, t, v) { return [(x - t * v.v()) * v.y, (t - x * v.v()) * v.y] }

    ttransform(t, v) { return t * v.y }
    tutransform(t, v) { return t / v.y }
    rtransform(x, t) { return [(x - t * this.reference.v()) * this.reference.y * this.tscale, (t - x * this.reference.v()) * this.reference.y * this.tscale] }
}

class Vector {
    constructor({ x, color }) {
        this.t = 0; this.ts = 0
        this.xFunction(x)
        this.color = color ?? '#FF0000'
    }
    v(t, p) { const d = p ?? 1 / 8, v = (this.x((t ?? this.t) - d) - this.x((t ?? this.t) + d)) / (2 * d); return Math.abs(v) > 1 ? Math.sign(v) * 0.999 : v }
    get y() { return 1 / Math.sqrt(1 - this.v() ** 2) }
    xFunction(x) { this.x = t => x(t ?? this.t), this.xFuncionString = x }
}

exports = Engine
