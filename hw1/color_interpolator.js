/**
 *
 * @param size {number}
 * @param colors {number[]} for corners color
 * @param x {number}
 * @param y {number}
 */
function colorInterpolator (size, colors, x, y) {
  // prepare the points
  const leftBottom = {
    x: 0,
    y: 0
  }
  const leftTop = {
    x: 0,
    y: size
  }
  const rightTop = {
    x: size,
    y: size
  }
  const rightBottom = {
    x: size,
    y: 0
  }
  const current = {
    x,
    y
  }
  // detect the point is in which triangle
  const targetColor = [
    [colors[0], colors[1], colors[2], colors[3]],
    [colors[8], colors[9], colors[10], colors[11]]
  ]
  const triangle = [leftBottom, rightTop]
  if (distance(current, leftTop) > distance(current, rightBottom)) {
    // point is closer to rightBottom
    triangle.push(rightBottom)
    targetColor.push([colors[4], colors[5], colors[6], colors[7]])
  } else {
    // point is closer to rightTop
    triangle.push(leftTop)
    targetColor.push([colors[12], colors[13], colors[14], colors[15]])
  }
  console.assert(targetColor.length === 3)
  console.assert(triangle.length === 3)
  // then, calculate the result color
  // reference: https://codeplea.com/triangular-interpolation
  let r, g, b
  const w0 = 1 / distance(current, triangle[0])
  const w1 = 1 / distance(current, triangle[1])
  const w2 = 1 / distance(current, triangle[2])
  const base = w0 + w1 + w2
  r = w0 * targetColor[0][0] + w1 * targetColor[1][0] + w2 * targetColor[2][0]
  r = r / base
  g = w0 * targetColor[0][1] + w1 * targetColor[1][1] + w2 * targetColor[2][1]
  g = g / base
  b = w0 * targetColor[0][2] + w1 * targetColor[1][2] + w2 * targetColor[2][2]
  b = b / base
  return [r, g, b, 1]
}

function distance (p1, p2) {
  const a = Math.pow(p1.x - p2.x, 2)
  const b = Math.pow(p1.y - p2.y, 2)
  return Math.sqrt(a + b)
}
