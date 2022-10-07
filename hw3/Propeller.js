// A little right triangle in the first quadrant as a test figure
var numPoints = 3
var vertices = new Float32Array([
    0.0, 0.0,
    0.3, 0.0,
    0.3, 0.3
  ]
)

// A few global variables...

// the OpenGL context
var gl

// handle to a buffer on the GPU
var vertexbuffer

// handle to the compiled shader program on the GPU
var shader

// code to actually render our geometry
function draw (modelMatrixElements) {
  // clear the framebuffer

  // bind the shader
  gl.useProgram(shader)

  // bind the buffer for the axes
  // gl.bindBuffer(gl.ARRAY_BUFFER, axisbuffer);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position')
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position')
    return
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex)

  // associate the data in the currently bound buffer with the a_position attribute
  // (The '2' specifies there are 2 floats per vertex in the buffer)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  // we can unbind the buffer now
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // set uniform in shader for color (axes are black)
  var colorLoc = gl.getUniformLocation(shader, 'color')
  gl.uniform4f(colorLoc, 0.0, 0.0, 0.0, 1.0)

  // set uniform in shader for transformation ("false" means that
  // the array we're passing is already column-major); for axes
  // use the identity since we don't want them to move
  var transformLoc = gl.getUniformLocation(shader, 'transform')
  gl.uniformMatrix4fv(transformLoc, false, new THREE.Matrix4().elements)

  // draw line segments for axes
  // gl.drawArrays(gl.LINES, 0, 3);

  // bind buffer for points (using the same shader)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer)

  // set data for position attribute
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0)

  // unbind
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // set color in fragment shader to red
  gl.uniform4f(colorLoc, 1.0, 0.0, 0.0, 1.0)

  // set transformation to our current model matrix
  gl.uniformMatrix4fv(transformLoc, false, modelMatrixElements)

  // draw triangle
  gl.drawArrays(gl.TRIANGLES, 0, numPoints)
  // gl.drawArrays(gl.TRIANGLES, 0, numPoints);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex)
  gl.useProgram(null)
}

// entry point when page is loaded
function main () {

  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

  // get graphics context
  gl = getGraphicsContext('theCanvas')

  // load and compile the shader pair
  shader = createProgram(gl, 'vertexShader', 'fragmentShader')

  // load the vertex data into GPU memory
  vertexbuffer = createAndLoadBuffer(vertices)

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.8, 0.8, 1.0)

  // we could just call draw() once to see the result, but setting up an animation
  // loop to continually update the canvas makes it easier to experiment with the
  // shaders
  //draw();
  let r = new THREE.Matrix4()

  let theta = 0
  const radio = 0.75
  const increment = toRadians(1)
  let degree = 0

  // M = TRS

  // define an animation loop
  var animate = function () {
    // clear the buffer each time
    gl.clear(gl.COLOR_BUFFER_BIT)
    const x = radio * Math.cos(theta)
    const y = radio * Math.sin(theta)
    // scale
    let m = new THREE.Matrix4().makeScale(0.5, 3, 1)
    // rotate
    m.premultiply(r.makeRotationZ(toRadians(degree += 4)))
    //
    // translate
    m.premultiply(new THREE.Matrix4().makeTranslation(x, y, 0))

    draw(m.elements)

    // another triangle
    m.multiply(new THREE.Matrix4().makeRotationZ(toRadians(180)))
    draw(m.elements)
    if (toDegrees(theta) > 360) theta = 0
    else theta += increment

    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate)
  }

  // start drawing!
  animate()
}
