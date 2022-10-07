//
// Colored rotating cube. Illustrates perspective projection.
// See definition of view and projection matrices below.
// See animation loop for transformations.
//
// Code to actually make the cube model has been moved into
// cs336util.js as function makeCube

// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec4 a_Color;
varying vec4 color;
void main()
{
  color = a_Color;
  gl_Position = transform * a_Position;
}
`;

// fragment shader
const fshaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;

var axisVertices = new Float32Array([
  0.0, 0.0, 0.0,
  1.5, 0.0, 0.0,
  0.0, 0.0, 0.0,
  0.0, 1.5, 0.0,
  0.0, 0.0, 0.0,
  0.0, 0.0, 1.5]);

var axisColors = new Float32Array([
  1.0, 0.0, 0.0, 1.0,
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0,
  0.0, 0.0, 1.0, 1.0]);

let linesVertices = new Float32Array([
  0.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
])

let lineColors = new Float32Array([
  // black
  0.0, 0.0, 0.0, 1.0,
  0.0, 0.0, 0.0, 1.0,
])

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexColorBuffer;
var indexBuffer;
var axisBuffer;
var axisColorBuffer;
var lineBuffer;
var lineColorBuffer;

// handle to the compiled shader program on the GPU
var shader;

// transformation matrices
var model = new THREE.Matrix4();

//view matrix
var view;

//One strategy is to identify a transformation to our camera frame,
//then invert it.  Here we use the inverse of
// RotateY(30) * RotateX(-45) * Translate(0, 0, 5)
// view = new THREE.Matrix4().makeTranslation(0, 0, -5)
//     .multiply(new THREE.Matrix4().makeRotationX(toRadians(45)))
//     .multiply(new THREE.Matrix4().makeRotationY(toRadians(-30)));



// Alternatively, use the LookAt function, specifying the view (eye) point,
// a point at which to look, and a direction for "up".
// Approximate view point (1.77, 3.54, 3.06) corresponds to the view
// matrix described above
view = createLookAtMatrix(
  new THREE.Vector3(1.77, 3.54, 3.06),   // eye
  new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
  new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis


// Using a perspective matrix
var projection;

// 1) try the same numbers as before, with aspect ratio 1.5
projection = new THREE.Matrix4().makePerspective(-1.5, 1.5, 1, -1, 4, 6);

// 2) what happens if we bring the near plane closer?
//projection = new THREE.Matrix4().makePerspective(-1.5, 1.5, 1, -1, 2, 6);

// 3) try calculating a desired field of view
// a 30 degree field of view with near plane at 4 corresponds
// view plane top of 4 * tan(15) = 1.07, with aspect ratio 3/2
// we get 1.07 * 3/2 = 1.61 for width
//projection = new THREE.Matrix4().makePerspective(-1.61, 1.61, 1.07, -1.07, 4, 6);

// 4) Alternatively, use a helper function to specify the field of
// view, aspect ratio, and near/far clipping planes
//projection = createPerspectiveMatrix(30, 1.5, 4, 6);

// 5) Try decreasing the field of view
//var projection = createPerspectiveMatrix(15, 1.5, 4, 6);



var axis = 'y';
var paused = false;


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
  if (event.which == null) {
    return String.fromCharCode(event.keyCode) // IE
  } else if (event.which!=0 && event.charCode!=0) {
    return String.fromCharCode(event.which)   // the rest
  } else {
    return null // special key
  }
}

let head = 0
let pitch = 0

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
  var ch = getChar(event);
  switch(ch)
  {
    // rotation controls
    case ' ':
      paused = !paused;
      break;
    case 'x':
      head += 5
      break;
    case 'X':
      head -= 5
      break;
    case 'y':
      pitch += 5
      break;
    case 'Y':
      pitch -= 5
      break;
  }
  console.log('Pitch ', pitch)
  console.log('Head ', head)
}

// code to actually render our geometry
function draw()
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

  // bind the shader
  gl.useProgram(shader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(shader, 'a_Color');
  if (colorIndex < 0) {
    console.log('Failed to get the storage location of a_');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);

  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set uniform in shader for projection * view * model transformation
  let m = new THREE.Matrix4().copy(model)
  m.premultiply(new THREE.Matrix4().makeRotationX(toRadians(head)))
  m.premultiply(new THREE.Matrix4().makeRotationY(toRadians(pitch)))
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(m);

  var transformLoc = gl.getUniformLocation(shader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  gl.drawArrays(gl.TRIANGLES, 0, 36);

  // draw cube line
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 2);

  // draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set transformation to projection * view only
  transform = new THREE.Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 6);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);
}

// entry point when page is loaded
function main() {

  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

// get graphics context
  gl = getGraphicsContext("theCanvas");

  // key handlers
  window.onkeypress = handleKeyPress;

  // create model data
  var cube = makeCube();

  // load and compile the shader pair
  shader = createProgram(gl, vshaderSource, fshaderSource);

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(cube.vertices);

  // buffer for vertex colors
  vertexColorBuffer = createAndLoadBuffer(cube.colors);

  // axes
  axisBuffer = createAndLoadBuffer(axisVertices);

  // cube line
  lineBuffer = createAndLoadBuffer(linesVertices)

  // cube line color
  lineColorBuffer = createAndLoadBuffer(lineColors)

  // buffer for axis colors
  axisColorBuffer = createAndLoadBuffer(axisColors);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function() {
    draw();

    // increase the rotation by 1 degree, depending on the axis chosen
    if (!paused)
    {
      // 1) "extrinsic" coordinate axis rotations
      // multiply on *left* by a new one-degree rotation about the chosen axis
      // this always rotates about one of the world coordinate axes

      switch(axis)
      {
        case 'x':
          model.premultiply(new THREE.Matrix4().makeRotationX(toRadians(1)));
          break;
        case 'y':
          model.premultiply(new THREE.Matrix4().makeRotationY(toRadians(1)));
          break;
        case 'z':
          model.premultiply(new THREE.Matrix4().makeRotationZ(toRadians(1)));
          break;
        default:
      }


      // 2) "intrinsic" coordinate axis rotations
      // multiply on *right* by a new one-degree rotation about the chosen axis
      // this always rotates about one of the cube's local coordinate axes
      //  switch(axis)
      //  {
      //  case 'x':
      //    model.multiply(new THREE.Matrix4().makeRotationX(toRadians(1)));
      //    break;
      //  case 'y':
      //    model.multiply(new THREE.Matrix4().makeRotationY(toRadians(1)));
      //    break;
      //  case 'z':
      //    model.multiply(new THREE.Matrix4().makeRotationZ(toRadians(1)));
      //    break;
      //  default:
      // 	}
      //

    }

    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
