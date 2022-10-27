//
// Lighting, continued.  Similar to Lighting.js but here we add a function
// to take a model created by three.js and extract the data for
// vertices and normals, so we can load it directly to the GPU.  This
// is just to have some models to play with besides the cube.
//
// This js file can be loaded with any of the following html files,
// each of which uses a different shader pair.  See comments for explanation.
// (Lighting2.html, Lighting2a.html, Lighting2b.html, Lighting2c.html)
//
// Edit main() to choose a model and to select face normals or vertex normals.
//
// Note you will need the three.js library.  Check the path in the html file.
//

// raw data for drawing coordinate axes
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

// A few global variables...

// the OpenGL context
var gl;

// our model
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;

// transformation matrices
var model = new THREE.Matrix4();

// view matrix
var view = createLookAtMatrix(
               new THREE.Vector3(1.77, 3.54, 3.06),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis

// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
//var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);
var projection = createPerspectiveMatrix(30, 1.5, 1, 100);

var axis = 'x';
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

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
	var ch = getChar(event);
	switch(ch)
	{
	case ' ':
		paused = !paused;
		break;
	case 'x':
		axis = 'x';
		break;
	case 'y':
		axis = 'y';
		break;
	case 'z':
		axis = 'z';
		break;
	case 'o':
		model.setIdentity();
		axis = 'x';
		break;
		default:
			return;
	}
}



// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

  // bind the shader
  gl.useProgram(lightingShader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
  if (normalIndex < 0) {
	    console.log('Failed to get the storage location of a_Normal');
	    return;
	  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);

  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set uniform in shader for projection * view * model transformation
  var loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, model.elements);
  loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

  // set a light position at (2, 4, 2)
  loc = gl.getUniformLocation(lightingShader, "lightPosition");
  gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);

  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);


  // bind the shader for drawing axes
  gl.useProgram(colorShader);

  // get the index for the a_Position attribute defined in the vertex shader
  positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(colorShader, 'a_Color');
  if (colorIndex < 0) {
	    console.log('Failed to get the storage location of a_Color');
	    return;
	  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);


  // draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set transformation to projection * view only
  loc = gl.getUniformLocation(colorShader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(loc, false, transform.elements);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 6);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {

  // *** choose a model
  // basic sphere
  theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));

  // sphere with more faces
  //theModel = getModelData(new THREE.SphereGeometry(1, 24, 12));
  //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

  // torus knot
  //theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));


    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // load and compile the shaders
    lightingShader = createProgram(gl, 'vertexLightingShader', 'fragmentLightingShader');
    colorShader = createProgram(gl, 'vertexColorShader', 'fragmentColorShader');

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(theModel.vertices);

    // *** choose face normals or vertex normals or wacky normals
    //vertexNormalBuffer = createAndLoadBuffer(theModel.normals);
    vertexNormalBuffer = createAndLoadBuffer(theModel.vertexNormals);
    //vertexNormalBuffer = createAndLoadBuffer(theModel.reflectedNormals);

    // buffer for axis vertices
    axisBuffer = createAndLoadBuffer(axisVertices)

    // buffer for axis colors
    axisColorBuffer = createAndLoadBuffer(axisColors)

    // specify a fill color for clearing the framebuffer
    gl.clearColor(0.0, 0.3, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // define an animation loop
    var animate = function() {
  	draw();

    // increase the rotation by 1 degree, depending on the axis chosen
    if (!paused)
    {
      switch(axis)
      {
      case 'x':
        model = new THREE.Matrix4().makeRotationX(toRadians(0.2)).multiply(model);
        axis = 'x';
        break;
      case 'y':
        axis = 'y';
        model = new THREE.Matrix4().makeRotationY(toRadians(0.2)).multiply(model);
        break;
      case 'z':
        axis = 'z';
        model = new THREE.Matrix4().makeRotationZ(toRadians(0.2)).multiply(model);
        break;
      default:
      }
    }
  	// request that the browser calls animate() again "as soon as it can"
      requestAnimationFrame(animate);
    };

    // start drawing!
    animate();


}
