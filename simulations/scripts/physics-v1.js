var intersection = ([A, B], [C, D]) => [
	((A.x - C.x) * (C.y - D.y) - (A.y - C.y) * (C.x - D.x)) / ((A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x)),
	((A.x - C.x) * (A.y - B.y) - (A.y - C.y) * (A.x - B.x)) / ((A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x))
]
var distance = (A, B) => Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)
var lerp = (A, B, t) => A + (B - A) * t
var resultant = (a, b) => [Math.sqrt(a ** 2 + b ** 2), Math.atan(b / a) + (Math.sign(a || 1) == -1 ? Math.PI : 0)]
var toRadians = n => n * Math.PI / 180
var toDegrees = n => n * 180 / Math.PI

var vectorInfo = (x, y, name, value, angle) => {
    var c = ctx
	c.font = '20px  monospace'
	c.fillStyle = 'white'
	c.fillText(`${name}=${value?.toFixed ? value.toFixed(2) : value}`, x, y)
	if (angle === undefined) return
	c.strokeStyle = 'white'
	c.beginPath()
	c.arc(x - 16, y - 5, 10, 0, 360)
	c.stroke(), c.closePath()
	c.beginPath()
	c.moveTo(x - 16, y - 5)
	c.lineTo(x - 16 + Math.cos(angle) * 10, y - 5 + Math.sin(angle) * 10)
	c.stroke(), c.closePath()
}

class Vector {
	constructor(x, y, ctx, name, m) {
		this.x = x, this.y = y, this.ctx = ctx
		this.forces = [], this.acc = [], this.vel = [0, 0]
		this.name = name
		this.m = m || 1
	}
	draw(ctx, options) {
		var c = ctx || this.ctx
		c.fillStyle = options?.fill || 'red'
		c.beginPath()
		c.arc(this.x, this.y, options?.radius || 1.5, 0, 360)
		c.fill(), c.closePath()
		if (!this.name) return
		c.font = '24px  monospace'
		var p = options?.radius || 1.5 
		c.fillText(this.name, this.x, this.y + p + 24)
		if (!options?.details) return
		vectorInfo(this.x, this.y + 48, 'a', ...resultant(...this.acc))
		vectorInfo(this.x, this.y + 72, 'v', ...resultant(...this.vel))
		vectorInfo(this.x, this.y + 96, 'h', c.canvas.height - this.y - 100)
		if (this.m != 1) vectorInfo(this.x, this.y + 120, 'm', this.m)
	}
	update(dt){
		if (this.freze) return 
		this.acc = [0, 0]
		this.forces.forEach(force => {
			this.acc[0] -= force[0] * Math.cos(force[1]) / this.m
			this.acc[1] -= force[0] * Math.sin(force[1]) / this.m
		})
		this.x += this.vel[0] * dt + this.acc[0] * dt ** 2 / 2
		this.y += this.vel[1] * dt + this.acc[1] * dt ** 2 / 2
		this.vel[0] += this.acc[0] * dt, this.vel[1] += this.acc[1] * dt
	}
	*[Symbol.iterator]() { yield this.x; yield this.y }
}

class Line{
	constructor(A, B, ctx) {
		this.A = Array.isArray(A) ? new Vector(...A, ctx) : A
		this.B = Array.isArray(B) ? new Vector(...B, ctx) : B
		this.ctx = ctx || this?.A?.ctx || this?.B?.ctx
	}
	draw(ctx, options) {
		var c = ctx || this.ctx
		c.strokeStyle = options?.stroke || 'white', c.lineWidth = options?.width || 1.5
		c.beginPath()
		c.moveTo(...this.A); c.lineTo(...this.B)
		c.stroke(); c.closePath()
		this.A.draw(c, options)
		if (options?.B !== false) this.B.draw(c, options)
	}
	intersect(line) {
		var i = intersection([this.A, this.B], [line.A, line.B]), is = []
		if (i.every(t => t >= 0 && t <= 1)) return new Vector(lerp(this.A.x, this.B.x, i[0]), lerp(line.A.y, line.B.y, i[1]), c)
		else return null
	}
	*[Symbol.iterator]() { yield this.A; yield this.B }
}

class Polygon{
	constructor(corners, ctx) {
		this.corners = corners.map(corner => Array.isArray(corner) ? new Vector(...corner) : corner)
		this.sides = []
		for (let i = 0; i < corners.length; i++) this.sides.push(new Line(this.corners[i], this.corners[(i + 1) % corners.length], ctx))
	}
	draw(ctx, options) {
		var c = ctx || this.ctx
		if (!options) var options = {}
		options.B = false
		this.sides.forEach(line => line.draw(c, options))
	}
	intersect(line) {
		var is = []
		for (let side of this.sides) {
			var i = line.intersect(side)
			if (i) is.push([i, distance(line.A, i)])
		}
		if (is.length) {
			var min = [0, Infinity]
			for (let i = 0; i < is.length; i++) if (is[i][1] < min[1]) min = is[i]
			return min[0]
		}
		else return null
	}
}

exports = { Vector }
