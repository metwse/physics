/* Requires: ctx */


intersection = ([A, B], [C, D]) => [
	((A.x - C.x) * (C.y - D.y) - (A.y - C.y) * (C.x - D.x)) / ((A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x)),
	((A.x - C.x) * (A.y - B.y) - (A.y - C.y) * (A.x - B.x)) / ((A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x))
]

lerp = (A, B, t) => A + (B - A) * t
distance = (A, B) => Math.sqrt((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2)
resultant = (a, b) => [Math.sqrt(a ** 2 + b ** 2), Math.atan2(b, a)]

toRadians = a => a * Math.PI / 180, toDegrees = a => a / Math.PI * 180

class Physics2D {
	constructor(ctx, opt) {
		this.ctx = ctx
		this.vectors = [], this.lines = [], this.polygons = []
		this.g = opt?.g !== undefined ? opt?.g : 10
		this.airFriction = opt?.airFriction || 0.001
		this.objId = 0
	}

	createVector(x, y, options) {
		let vector = new Vector(x, y, this.ctx, this, options)
		this.vectors.push(vector); return vector
	}
	createLine(A, B, options) {
		let line = new Line(new Vector(...A, this.ctx, this, options), new Vector(...B, this.ctx, this, options), this.ctx, this, options)
		line.A.id = line.B.id = line.id = this.objId++
		this.lines.push(line); return line
	}
	createPolygon(corners, options) {
		let polygon = new Polygon(corners, this.ctx, this, options)
		polygon.id = this.objId++ 
		this.polygons.push(polygon)
		return polygon
	}

	update(dt, opt) {
		this.vectors.concat(this.lines, this.polygons).forEach(vector => vector.update(dt, opt))
	}

	draw(opt) {
		this.vectors.concat(this.lines, this.polygons).forEach(vector => vector.draw(opt))
	}
}

class Vector {
	constructor(x, y, ctx, engine, options) {
		/*
		options: {
			name, m
		}
		*/
		this.x = x, this.y = y
		this.F = [], this.a = [0, 0], this.v = [0, 0]
		this.F.temp = []
		this.m = options?.m || 1
		
		this.name = options?.name
		this.ctx = ctx, this.engine = engine
		this.intersected = false
	}

	static vectorInfo(x, y, ctx, name, value, unit, angle) {
		ctx.font = '16px  monospace', ctx.fillStyle = 'white'
		ctx.fillText(`${name}=${value ? value?.toFixed ? value.toFixed(1) : value : '0.0'}${unit || ''}`, x, y)
		if (angle === undefined) return
		ctx.strokeStyle = 'white'
		ctx.beginPath()
		ctx.arc(x - 16, y - 4, 8, 0, 360)
		ctx.moveTo(x - 16, y - 4)
		ctx.lineTo(x - 16 + Math.cos(angle) * 8, y - 5 + Math.sin(angle) * 8)
		ctx.stroke(), ctx.closePath()
	}
	static distance = (A, B) => Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)

	move(x, y) { this.x = x, this.y = y }
	moveBy(_x, _y, opt) {
		let x = _x, y = _y
		
		for (let line of this.engine.lines.concat(this.engine.polygons.map(polygon => polygon.sides)).flat()) {
			if (line.id == this.id) continue
			let thisLine = new Line([this.x + this.v[0], this.y + this.v[1]], [this.x - this.v[0], this.y - this.v[1]]),
				I = thisLine.intersect(line)
			if (!I) continue

			let xDistance = I[0] - this.x, yDistance = I[1] - this.y,
				maxX = Math.abs(xDistance) <= Math.abs(x) && Math.sign(xDistance) == Math.sign(this.v[0]), maxY = Math.abs(yDistance) <= Math.abs(y) && Math.sign(yDistance) == Math.sign(this.v[1]),
				thisAngle = Math.PI - thisLine.angle,
				R = Math.matrix.mult(Math.matrix.rotation(Math.PI - 2 * line.angle), [[Math.cos(thisAngle)], [Math.sin(thisAngle)]])

			if (opt?.speedVectors) {
				let N = Math.matrix.mult(Math.matrix.rotation(Math.PI - line.angle), [[0], [1]])
				// // // //
				// speed
				this.ctx.beginPath()
				this.ctx.strokeStyle = 'gray'
				this.ctx.moveTo(...thisLine.A)
				this.ctx.lineTo(...thisLine.B)
				this.ctx.stroke(), this.ctx.closePath()
				// normal
				this.ctx.strokeStyle = 'red'
				this.ctx.beginPath()
				this.ctx.moveTo(I[0] + N[0][0] * -10, I[1] + N[1][0] * -10)
				this.ctx.lineTo(I[0] + N[0][0] * 10, I[1] + N[1][0] * 10)
				this.ctx.stroke(), this.ctx.closePath()
				// reflection
				this.ctx.strokeStyle = 'green'
				this.ctx.beginPath()
				this.ctx.moveTo(...I)
				this.ctx.lineTo(I[0] + R[0][0] * 50, I[1] + R[1][0] * 50)
				this.ctx.stroke(), this.ctx.closePath()
				// // // //
			}

			// debug
			/*
			this.ctx.fillStyle = 'white'
			this.ctx.font = '16px monospace'
			this.ctx.fillText(`xD: ${xDistance.toFixed(2)}, yD: ${yDistance.toFixed(2)}`, ...this)
			this.ctx.fillText(`x: ${x.toFixed(2)}, y: ${x.toFixed(2)}`, this.x, this.y - 16)
			this.ctx.fillText(`x: ${maxX}, y: ${maxY}`, this.x, this.y - 32
			*/

			// refletct if will collide with a line
			if (maxX || maxY) {
				if (maxX) {
					x = this.x - I[0] + R[0][0] * Math.abs(x)
					if (this.polygon) this.polygon.corners.forEach(corner => corner.x += x)
					else if (this.B) this.B.x += x
				}
				if (maxY) {
					y = this.y - I[1] + R[1][0] * Math.abs(y)
					if (this.polygon) this.polygon.corners.forEach(corner => corner.y += y)
					else if (this.B) this.B.y += y
				}
				this.reflectSpeed(line.angle)
				this.F.temp.push([this.m, line.angle])
				this.intersected = line
			}
		}

		this.x += x, this.y += y
	}

	reflectSpeed(angle) {
		var thisLine = new Line([this.x + this.v[0], this.y + this.v[1]], [this.x - this.v[0], this.y - this.v[1]]), thisAngle = Math.PI - thisLine.angle,
			R = Math.matrix.mult(Math.matrix.rotation(Math.PI - 2 * angle), [[Math.cos(thisAngle)], [Math.sin(thisAngle)]]), vr = resultant(...this.v)
		this.v = [R[0][0] * vr[0], R[1][0] * vr[0]]
	}

	update(dt, opt) {
		if (this.frozen) return
		dt /= 1000
		this.a = [0, 0]
		this.F.concat(this.F.temp || []).forEach(F => {
			this.a[0] = F[0] * Math.cos(F[1]) / this.m
			this.a[1] = F[0] * Math.sin(F[1]) / this.m
		})
		this.a[1] += this.m * this.engine.g
		this.F.temp = []
		
		this.moveBy(this.v[0] * dt + this.a[0] * dt ** 2 / 2, this.v[1] * dt + this.a[1] * dt ** 2 / 2, opt)
		this.v[0] += this.a[0] * dt, this.v[1] += this.a[1] * dt
	}

	draw(options) {
		this.ctx.fillStyle = options?.fill || 'red'
		this.ctx.beginPath()
		this.ctx.arc(this.x, this.y, options?.radius || 2, 0, 360)
		this.ctx.fill(), this.ctx.closePath()
		if (options?.name) {
			ctx.font = '20px  monospace'
			ctx.fillStyle = 'white'
			this.ctx.fillText(this.name, this.x, this.y + 20)
		}
		if (!options?.details) return
		![['a', ...resultant(...this.a), 'm/s²'], ['v', ...resultant(...this.v), 'm/s']].forEach(([name, value, angle, unit], index) => Vector.vectorInfo(this.x, this.y + (index + (options?.name ? 2 : 1)) * 20, this.ctx, name, value, unit, angle))
	}

	*[Symbol.iterator]() { yield this.x; yield this.y }
}

class Line {
	constructor(A, B, ctx, engine, options) {
		this.A = A instanceof Vector ? A : new Vector(...A), this.B = B instanceof Vector ? B : new Vector(...B)
		this.A.B = this.B, this.B.B = A
		this.length = Vector.distance(A, B)
		this.updateG()
		this.k = options?.k
		this.ctx = ctx, this.engine = engine
		this.oldAngle = this.angle, this.oldG = this.G
	}

	updateG() {
		this.totalM = (this.A.m + this.B.m)
		this.G = [(this.A.x * this.A.m + this.B.x * this.B.m) / this.totalM - this.A.x, (this.A.y * this.A.m + this.B.y * this.B.m) / this.totalM - this.A.y]
	}
	get slope() { return (this.A.y - this.B.y) / (this.A.x - this.B.x) }
	get angle() { return Math.atan2(this.A.y - this.B.y, this.A.x - this.B.x) }

	update(dt, opt) {
		if (this.frozen) return

		if (this.engine.airFriction) {
			let vr, vAr, vBr, Fa

			vr = resultant(...this.A.v)
			vAr = Math.matrix.mult([[0, 1], [1, 0]], [[this.A.v[0]], [this.A.v[1]]]),
			Fa = [this.engine.airFriction * Math.abs(Math.matrix.dotProduct([this.A.x - this.B.x, this.A.y - this.B.y], [vAr[0][0], vAr[1][0]])) * vr[0] ** 2, Math.PI + vr[1]]
			if (!isNaN(Fa[0])) this.A.F.push(Fa)

			vr = resultant(...this.B.v)
			vBr = Math.matrix.mult([[0, 1], [1, 0]], [[this.B.v[0]], [this.B.v[1]]])
			Fa = [this.engine.airFriction * Math.abs(Math.matrix.dotProduct([this.A.x - this.B.x, this.A.y - this.B.y], [vBr[0][0], vBr[1][0]])) * vr[0] ** 2, Math.PI + vr[1]]
			if (!isNaN(Fa[0])) this.B.F.push(Fa)
		}

		if (this.k) {
			let Fspring = (Vector.distance(this.A, this.B) - this.length) * this.k
			let angle = Math.atan((this.A.y - this.B.y) / (this.A.x - this.B.x)) || Math.PI / 2 * Math.sign(this.A.y - this.B.y)
			let left = this.A.x < this.B.x ? -1 : 1
			this.updateG()

			this.A.F.temp.push([Fspring * -left / 2, angle])
			this.B.F.temp.push([Fspring * left / 2, angle])

		} else {
			let oldAngle = this.oldAngle, oldG = this.oldG
			this.updateG()
			let angle = this.angle, dAngle = oldAngle - angle

			let oldGAngle = Math.atan2(oldG[1], oldG[0])
			let rotated = Math.matrix.mult(Math.matrix.rotation(dAngle),
				[[this.length / this.totalM * Math.cos(oldGAngle), -this.length / this.totalM * Math.cos(oldGAngle)],
				 [this.length / this.totalM * Math.sin(oldGAngle), -this.length / this.totalM * Math.sin(oldGAngle)]])
			
			this.B.moveBy((rotated[0][0] * this.A.m + this.A.x + this.G[0]) - this.B.x, (rotated[1][0] * this.A.m + this.A.y + this.G[1]) - this.B.y)
			this.A.moveBy((rotated[0][1] * this.B.m + this.A.x + this.G[0]) - this.A.x, (rotated[1][1] * this.B.m + this.A.y + this.G[1]) - this.A.y)
			
			this.A.intersected = this.B.intersected = false

		}
		if (opt?.update !== false) this.A.update(dt, opt), this.B.update(dt, opt)
	}

	intersect(line, range) {
		let [t, u] = intersection([...this], [...line])
		if (range || 0 <= t && t <= 1 && 0 <= u && u <= 1) return [lerp(this.A.x, this.B.x, t), lerp(line.A.y, line.B.y, u)].concat(range ? [0 <= t && t <= 1 && 0 <= u && u <= 1] : [])
		else return null
	}

	draw(options) {
		this.ctx.strokeStyle = options?.stroke || (this.frozen ? 'white' : '#0FFF0F')
		if (!this.frozen) {
			this.ctx.beginPath()
			this.ctx.arc((this.A.x + this.G[0]), (this.A.y + this.G[1]), 3, 0, Math.PI * 2)
			this.ctx.stroke()
		}
		this.ctx.beginPath()
		this.ctx.moveTo(...this.A)
		this.ctx.lineTo(...this.B)
		this.ctx.stroke(), this.ctx.closePath()
		if (this.frozen) return
		this.A.draw(options), this.B.draw(options)
	}

	*[Symbol.iterator]() { yield this.A; yield this.B }
}

class Polygon {
	constructor(corners, ctx, engine, options) {
		this.sides = []
		this.corners = corners.map(corner => {
			let c = corner instanceof Vector ? corner : new Vector(...corner, ctx, engine, options)
			c.polygon = this
			return c
		})

		for (let i = 0; i < this.corners.length; i++) {
			this.sides.push(new Line(this.corners[i], this.corners[(i + 1) % this.corners.length], ctx, engine, options))
		}
		this.ctx = ctx, this.engine = engine
		this._id = 0
		this._frozen = false
	}
	set id(val) {
		this.corners.forEach(corner => corner.id = val)
		this.sides.forEach(side => side.id = val)
		this._id = val
	}
	get id() { return this._id }

	set frozen(val) {
		this.sides.forEach(side => side.frozen = val)
		this._frozen = true
	}
	get frozen() { return this._frozen }

	connect(A, B, options) {
		var line = new Line(this.corners[A], this.corners[B], this.ctx, this.engine, options)
		line.updateNodes = false
		line.id = this.id
		this.sides.push(line)
	}

	update(dt, opt) {
		if (this.frozen) return
		this.corners.forEach(corner => corner.update(dt))
		this.sides.forEach(side => { side.update(dt, { update: false, ...opt }) })
	}

	draw(opt) {
		this.sides.forEach(side => side.draw(opt))
	}
}

Math.matrix = {
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
