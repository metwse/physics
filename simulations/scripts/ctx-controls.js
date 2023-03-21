exports = ctx => {
    const canvas = ctx.canvas
    ctx.controls = { x: 0, y: 0, scale: 1 }
    const c = ctx.controls
    canvas.addEventListener('mousemove', ({ buttons, movementX, movementY }) => {
        if ((buttons & 4) == 4) {
            c.x += movementX
            c.y += movementY
        }
    })
    
    canvas.addEventListener('mousewheel', ({ deltaY, screenY, screenX }) => {
        var s = .90, t = c.scale
        if (deltaY < 0) s = 1 / s
        c.scale *= s
        c.x += -(c.scale - t) * (screenX - canvas.offsetLeft)
        c.y += -(c.scale - t) * (screenY - canvas.offsetTop)
    })

    var touchDistance, lastTouchDistance, touchCenter, lastTouchCenter
    canvas.addEventListener('touchmove', ({ touches: { ['0']: t1, ['1']: t2, length } }) => {
        if (length == 2) {
            touchDistance = Math.sqrt((t1.screenX - t2.screenX) ** 2 + (t1.screenY - t2.screenY) ** 2), touchCenter = [(t1.screenX + t2.screenX) / 2, (t1.screenY + t2.screenY) / 2]
            if (touchDistance && lastTouchDistance) {
                const t = c.scale
                c.scale *= touchDistance / lastTouchDistance
                c.x += (touchCenter[0] - lastTouchCenter[0]) * c.scale - (c.scale - t) * (touchCenter[0] - canvas.offsetLeft)
                c.y += (touchCenter[1] - lastTouchCenter[1]) * c.scale - (c.scale - t) * (touchCenter[1] - canvas.offsetTop)
            } 
            lastTouchDistance = touchDistance, lastTouchCenter = touchCenter
            
        } else lastTouchDistance = touchDistance = null
    })
    canvas.addEventListener('touchstart', () => touchDistance = lastTouchDistance = null)
}
