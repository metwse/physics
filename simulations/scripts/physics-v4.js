/**
 * @requires: Mathp, ctx
 */

ctx = eval('ctx') //lsp


class Engine {
    constructor() {
        this.id = 0
        this.objects = {}
        this.joints = {}
    }

    draw() {
        for (let o of Object.values(this.objects).concat(...Object.values(this.joints))) o.draw()
    }

    calculateForces() {
        var _, system, F, A, B, pivot, T //***//
        for (let i of Object.values(this.objects)) {
            _ = [0, 0]
            i.F.forEach(({ N: [x, y] }) => (_[0] += x, _[1] += y))
            i.F._ = _
        }
        for (let joints of Object.values(this.joints)) {
            system = [], A = joints[0].A, B = joints[0].B, F = [...A.F, ...B.F.map(v => v.relative(A))], T = F.map(({ N, x, y }) => [-N[0] * y, -N[1] * x])

            T = T.map(v => v[1]).reduce((a, b) => a + b)
            console.log(T)

            for (let j of joints) {
                F.push(...j.F.map(({ x, y, N, A: a }) => { return { x: x + a.x, y: y + a.y, N} }))
            }
            pivot = [
                T,
                T,
                T,
                T,
                T,
            ]

            F = [...joints, A, { x: B.x - A.x, y: B.y - A.y }]
            for (let [col, j] of F.entries()) {
                system[F.length - 1 - col] = F.map(({ x, y }) => [y - j.y, x - j.x])
            }

            console.log(pivot)
            console.log(Mathp.gaussianElimination(system.map(v => v.map(a => a[1])), pivot.map(v => v[1])))

            /*
            t
            tt(a)  >> x1 * n1 + x2 * n2 - t = -F.map(v => [N[0] * y, N[1] * x])
            tt(b)  >> x1 * n1 + x2 * n2 - t = 
            tt(n1) >>         + x2 * n2 - t = -F.map(v => [N[0] * (y - n1.y), N[1] * (x - n1.x)])
            tt(n2) >> x1 * n1           - t = -F.map(v => [N[0] * (y - n2.y), N[1] * (x - n2.x)])
            */
        }
    }

    Vector(...args) { 
        var vector = new Vector(this, this.id, ...args)
        this.objects[this.id] = vector, this.id++
        return vector
    }

    joint(_o1, _o2, x, y) {
        var o1 = !(_o1 instanceof Vector) ? this.objects[_o1] : _o1,  o2 = !(_o2 instanceof Vector) ? this.objects[_o2] : _o2, s = `${Math.min(o1.id, o2.id)}:${Math.max(o1.id, o2.id)}`,
            joint = new Joint(this, this.id++, o1, o2, s, x, y)
        if (!this.joints[s]) this.joints[s] = []
        this.joints[s].push(joint)
        return joint
   }
}


class Vector {
    constructor(e, id, x, y, { m }) {
        this.e = e, this.id = id
        this.x = x, this.y = y, this.m = m ?? 1
        this.F = [], this['τ'] = [0, 0]
    }

    addForce(N, x, y) { this.F.push(new Force(this.e, this.id, this, N, x, y)) }

    draw() {
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
}


class Joint {
    constructor(e, id, A, B, name, x, y) {
        this.e = e, this.id = id
        this.A = A, this.B = B, this.name = name
        this.x = x, this.y = y
        this.F = [], this['τ'] = [0, 0]
    }

    addForce(N, x, y) { this.F.push(new Force(this.e, this.id, this, N, x, y)) }

    draw() {
        ctx.fillStyle = 'gray'
        ctx.beginPath()
        ctx.arc(this.A.x + this.x, this.A.y + this.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
}


class Force {
    constructor(e, id, A, N, x, y) {
        this.e = e, this.id = id
        this.A = A, this.x = x, this.y = y
        this.N = N
    }

    relative(A) {
        return { x: this.x - A.x + this.A.x, y: this.y - A.y + this.A.y, N: this.N }
    }
}


exports = Engine
