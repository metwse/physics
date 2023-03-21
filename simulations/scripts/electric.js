const PI = Math.PI
const PI2 = PI * 2
const PI_2 = PI / 2

const intersection = ([A, B], [C, D]) => [
	((A[0] - C[0]) * (C[1] - D[1]) - (A[1] - C[1]) * (C[0] - D[0])) / ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0])),
	((A[0] - C[0]) * (A[1] - B[1]) - (A[1] - C[1]) * (A[0] - B[0])) / ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0]))
]

const lerp = (A, B, t) => A + (B - A) * t
const distance = (A, B) => Math.sqrt((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2)

const Mathm = {
	scalarMult(M, t) {
		return M.map(row => row.map(v => v * t))
	},
	rotation(angle) {
		return [[Math.cos(angle), Math.sin(angle)], [-Math.sin(angle), Math.cos(angle)]]
	},
	add(M, N) {
		if (M.length != N.length || M[0].length != N[0].length) return null
		return M.map((row, ri) => row.map((v, ci) => v + N[ri][ci]))
	},
	mult(M, N) {
		if (M[0].length != N.length) return null
		var matrix = []
		for (let Mrow = 0; Mrow < M.length; Mrow++) {
			matrix[Mrow] = new Array(N[0].length).fill(0)
			for (let Ncol = 0; Ncol < N[0].length; Ncol++)
				for (let Mcol = 0; Mcol < M[0].length; Mcol++)
					matrix[Mrow][Ncol] += M[Mrow][Mcol] * N[Mcol][Ncol]
		}
		return matrix
	},
	dotProduct(A, B) {
		return Math.matrix.mult([A], [[B[0]], [B[1]]]) / distance([0, 0], B)
	}
}

class Engine {
    constructor({ k, g, ctx }) {
        this.k = k ?? 9e9
        this.g = g ?? [0, 10]
        this.ctx = ctx
        this.vectors = []
        this.walls = []
    }

    newVector(args) { return this.vectors[this.vectors.push(args.rotatable ? new RotatingVector(this, args) : new Vector(this, args)) - 1] }
    newWall(A, B) { return this.walls.push(new Wall(A, B)) }

    update(dt) {
        for (let vi of this.vectors) {
            vi.Fex = []
            for (let vj of this.vectors)
                if (vi != vj) {
                    let d = Math.sqrt((vi.x - vj.x) ** 2 + (vi.y - vj.y) ** 2), m = Math.atan2(vi.y - vj.y, vi.x - vj.x),
                        F = this.k * vi.q * vj.q / d ** 2
                    vi.Fex.push([F * Math.cos(m), F * Math.sin(m)])
                }
        }
        for (let i = 0; i < this.vectors.length; i++) this.vectors[i].update(dt)
    }

    draw(ctx) { 
        for (let i = 0; i < this.vectors.length; i++) this.vectors[i].draw(ctx || this.ctx) 
        for (let i = 0; i < this.walls.length; i++) this.walls[i].draw(ctx || this.ctx) 
    }
}

class Wall {
    constructor(A, B) {
        this.A = A, this.B = B
    }
    intersect(A, B, range) {
		let [t, u] = intersection([A, B], [this.A, this.B])
		if (range || 0 <= t && t <= 1 && 0 <= u && u <= 1) return [lerp(A[0], B[0], t), lerp(this.A[1], this.B[1], u)].concat(range ? [0 <= t && t <= 1 && 0 <= u && u <= 1] : [])
		else return null
    }

    draw(ctx) {
        ctx.strokeStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(this.A[0], this.A[1])
        ctx.lineTo(this.B[0], this.B[1])
        ctx.stroke()
        ctx.closePath()
    }
}

class Vector {
    constructor(e, { q, m, x, y, anchored }) {
        this.x = x ?? 0, this.y = y ?? 0
        this.q = q ?? 0, this._m = m ?? 1
        this.a = [0, 0], this.v = [0, 0]
        this.anchored = anchored
        this.e = e
        var parentThis = this
        this._F = []
        this.F = new Proxy(this._F, { //{{{
            get(target, prop) { 
                if (prop == 'value') return target
                return ['push', 'pop', 'shift', 'unshift', 'splice'].includes(prop) ? (...args) => { var r = target[prop](...args); parentThis.calculateA(); return r } : target[prop]
            },
            set(target, prop, val) {
                if (prop == 'value') {
                    if (!Array.isArray(val)) return
                    target.splice(0); target.push(...val)
                    parentThis.calculateA()
                    return
                }
                if (!isNaN(prop) && !prop.includes('.') && Array.isArray(val)) {
                    parentThis.a[0] += val[0] / parentThis.m
                    parentThis.a[1] += val[1] / parentThis.m
                }
                target[prop] = val
            }
        }) //}}}
        this.Fex = []
    }

    get m() { return this._m }
    set m(val) { 
        this._m = val, this.a = [0, 0]
        this.calculateA()
    }
    get ['0']() { return this.x }
    get ['1']() { return this.y }
    calculateA() {
        this.a = [0, 0]
        for (let i = 0; i < this._F.length; i++)
            this.a[0] += this._F[i][0] / this.m, this.a[1] += this._F[i][1] / this.m
    }

    update(dt) {
        if (this.anchored) return
        var a = [this.a[0] + (this.g?.[0] ?? this.e?.g[0] ?? 0), this.a[1] + (this.g?.[1] ?? this.e?.g[1] ?? 0)]
        for (let i = 0; i < this.Fex.length; i++) a[0] += this.Fex[i][0] / this.m, a[1] += this.Fex[i][1] / this.m
        var dx = a[0] * dt ** 2 / 2 + this.v[0] * dt, dy = a[1] * dt ** 2 / 2 + this.v[1] * dt
        this.v[0] += a[0] * dt, this.v[1] += a[1] * dt
        this.tryMove(dx, dy)
    }
    tryMove(dx, dy, exception) {
        var intersection = false
        if (this.e)
            for (let wall of this.e.walls) {
                if (wall == exception) continue
                let line = [[this.x + this.v[0], this.y + this.v[1]], [this.x, this.y]],
                    I = wall.intersect(...line)
                let R = Mathm.mult(Mathm.rotation(PI - 2 * Math.atan2(wall.A[1] - wall.B[1], wall.A[0] - wall.B[0])), [[-this.v[0]], [this.v[1]]])
                if (I) {
                    var dI = distance(this, I), dD = distance(this, [this.x + dx, this.y + dy])
                    this.I = I, intersection = true 
                    if (dI < dD) { 
                        this.v = [R[0][0], R[1][0]]
                        var angle = Math.atan2(this.v[1], this.v[0]), r = dD - dI
                        this.x = I[0] + Math.cos(angle) * 2, this.y = I[1] + Math.sin(angle) * 2
                        return this.tryMove(r * Math.sin(angle), r * Math.cos(angle), wall)
                    }
                }
            }
        if (!intersection) delete this.I
        this.x += dx, this.y += dy
    }

    draw(ctx) {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(this.x, this.y, 3, 0, PI2)
        ctx.fill()
        ctx.closePath()
        if (this.q) ctx.fillText((this.q > 0 ? '+' : '') + this.q.toExponential(), this.x, this.y - 5)
        
        ctx.strokeStyle = 'gray'
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        if (this.I) ctx.lineTo(this.I[0], this.I[1])
        else ctx.lineTo(this.x + this.v[0], this.y + this.v[1])
        ctx.stroke()
        ctx.closePath()
    }
}

//{{{ RotatingVector 
class RotatingVector extends Vector {
    constructor(e, { q, m, x, y, r, angle, anchored }) {
        super(e, { q, m, x, y, anchored })
        this.center = [x, y]
        this.angle = angle ?? 0
        this.x += r * Math.cos(this.angle)
        this.y += r * Math.sin(this.angle)
        this.r = r ?? 0
        this.angularA = 0
        this.angularV = 0
    }

    update(dt) {
        if (this.anchored) return
        var a = [this.a[0] + (this.g?.[0] ?? this.e?.g[0] ?? 0), this.a[1] + (this.g?.[1] ?? this.e?.g[1] ?? 0)]
        for (let i = 0; i < this.Fex.length; i++) a[0] += this.Fex[i][0] / this.m, a[1] += this.Fex[i][1] / this.m
        this.angularA = (a[0] * Math.sin(this.angle) + a[1] * -Math.cos(this.angle)) / (PI2 * this.r)
        this.angle -= this.angularA * dt ** 2 / 2 + this.angularV * dt
        this.angularV += this.angularA * dt
        this.x = this.center[0] + this.r * Math.cos(this.angle)
        this.y = this.center[1] + this.r * Math.sin(this.angle)
    }

    draw(ctx) {
        ctx.strokeStyle = 'gray'
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.center[0], this.center[1])
        ctx.stroke()
        ctx.closePath()
        ctx.fillStyle = 'darkgray'
        ctx.arc(this.center[0], this.center[1], 1, 0, PI2)
        ctx.fill()
        super.draw(ctx)

        ctx.beginPath()
        ctx.arc(this.center[0], this.center[1], this.r, this.angle % PI2, this.angle % PI2 - this.angularV, Math.sign(this.angularV) == 1)
        ctx.stroke()
        ctx.closePath()
    }
}
//}}}


exports = Engine 
