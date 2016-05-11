webclgl
=======

[![Join the chat at https://gitter.im/stormcolor/webclgl](https://badges.gitter.im/stormcolor/webclgl.svg)](https://gitter.im/stormcolor/webclgl?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<h2>Javascript Library for general purpose computing on GPU, aka GPGPU.</h2>
WebCLGL use WebGL specification for interpreter the code.<br />

<h3>Now only one dependency is required</h3>
```html

    <script src="/js/WebCLGL.class.js"></script>
```

<h3>For a simple A+B</h3>
```js

    // TYPICAL A + B WITH CPU
    var arrayResult = [];
    for(var n = 0; n < _length; n++) {
        var sum = arrayA[n]+arrayB[n];
        arrayResult[n] = sum;
    }

    // PERFORM A + B WITH GPU
    var arrayResult = gpufor({"float* A": arrayA, "float* B": arrayB}, "n",
                              "float sum = A[n]+B[n];"+
                              "return sum;");
```

- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor/index.html"> gpufor A+B</a><br />

<h3>Using numbers</h3>
```js

    var num = 0.01;

    // CPU
    var arrayResult = [];
    for(var n = 0; n < _length; n++) {
        var sum = arrayA[n]+arrayB[n]+num;
        arrayResult[n] = sum;
    }

    // GPU
    var arrayResult = gpufor({"float* A": arrayA, "float* B": arrayB, "float num": num}, "n",
                              "float sum = A[n]+B[n]+num;"+
                              "return sum;");
```

- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor_numbers/index.html"> gpufor A+B+number</a><br />

<h3>Using arrays type vector</h3>
```js

    var arrayResult = gpufor({"float* A": arrayA, "float4* B": arrayB}, "n",
                              "float _A = A[n];"+
                              "vec4 _B = B[n];"+
                              "float sum = _A+_B.z;"+
                              "return sum;");
```

- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor_vectors/index.html"> gpufor vector read</a><br />

<h3>Vector as output</h3>
```js

    var arrayResult = gpufor({"float4* A": arrayA, "float4* B": arrayB}, "n", "FLOAT4",
                              "vec4 _A = A[n];"+
                              "vec4 _B = B[n];"+
                              "vec4 sum = _A+_B;"+
                              "return sum;");
```

- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor_vectors_output/index.html"> gpufor vector output</a><br />

<h3>Output datatypes</h3>
For to change the return precision from 0.0->1.0 by default to -1000.0->1000.0 set the gpufor precision variable
```js

    gpufor_precision = 1000.0;
    var arrayResult = gpufor...
```


<h3>Graphical output</h3>
```html

    <canvas id="graph" width="512" height="512"></canvas>
``` 

```js
   
       var arrayResult = gpufor(document.getElementById("graph"),
       
                               // VALUES
                               {"float4* posXYZW": arrayNodePosXYZW,
                               "float4* dir": arrayNodeDir,
                               "float*attr nodeId": arrayNodeId,
                               "mat4 PMatrix": transpose(getProyection()),
                               "mat4 cameraWMatrix": transpose(new Float32Array([	1.0, 0.0, 0.0, 0.0,
                                                                                   0.0, 1.0, 0.0, 0.0,
                                                                                   0.0, 0.0, 1.0, -100.0,
                                                                                   0.0, 0.0, 0.0, 1.0])),
                               "mat4 nodeWMatrix": transpose(new Float32Array([	1.0, 0.0, 0.0, 0.0,
                                                                                   0.0, 1.0, 0.0, 0.0,
                                                                                   0.0, 0.0, 1.0, 0.0,
                                                                                   0.0, 0.0, 0.0, 1.0]))},
                           
                               // KERNEL PROGRAM 1 (for to update "dir" argument)
                               ["n", "dir",
                               // head
                               '',
                               // source
                               'vec3 newDir = dir[n].xyz*0.995;\n'+
                               'return vec4(newDir,0.0);\n'],
                           
                               // KERNEL PROGRAM 2 (for to update "posXYZW" argument from updated "dir" argument on KERNEL1)
                               ["posXYZW += dir"],
                           
                               // GRAPHIC PROGRAM
                               [   // vertex head
                                   '',
                           
                                   // vertex source
                                   'vec2 xx = get_global_id(nodeId[], uBufferWidth, 1.0);'+
                           
                                   'vec4 nodePosition = posXYZW[xx];\n'+ // now use the updated posXYZW
                                   'mat4 nodepos = nodeWMatrix;'+
                                   'nodepos[3][0] = nodePosition.x;'+
                                   'nodepos[3][1] = nodePosition.y;'+
                                   'nodepos[3][2] = nodePosition.z;'+
                           
                                   'gl_Position = PMatrix * cameraWMatrix * nodepos * vec4(1.0, 1.0, 1.0, 1.0);\n'+
                                   'gl_PointSize = 2.0;\n',
                           
                                   // fragment head
                                   '',
                           
                                   // fragment source
                                   'gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n'
                               ]);
```
```js

    var tick = function() {
                    window.requestAnimFrame(tick);
    
                    gpufG.processKernels();
                    gpufG.update("posXYZW");
                    gpufG.update("dir");
    
                    var gl = gpufG.getCtx();
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.viewport(0, 0, 512, 512);
                    gl.clearColor(0.0, 0.0, 0.0, 1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    
                    //gpufG.setArg("pole1X", 30);
    
                    gpufG.processGraphic("posXYZW", gl.POINTS);
                };
```

- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor_graphics/index.html"> gpufor graphic output</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor_graphics_geometry/index.html"> gpufor graphic output (using custom geometry)</a><br />




<h3><a href="https://rawgit.com/stormcolor/webclgl/master/APIdoc/APIdoc/global.html#gpufor">API Doc WebCLGL</a></h3>
<h3><a href="http://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf">OpenGL ES Shading Language 1.0 Reference Card (Pag 3-4)</a></h3>

<h3>Old demos (without use gpufor function)</h3>
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB/index.html"> Basic example A+B</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB_and_number/index.html"> Basic example A+B+num</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/benchmarks/index.html"> Benchmarks</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors/index.html"> Using vectors</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors_as_output/index.html"> Using vectors as output</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/WebCLGLWork_3D_graphics/index.html"> Graphic output using WebCLGLWork</a> <br />
- <a href="https://github.com/stormcolor/SCEJS"> SCEJS</a> use WebCLGL as low level layer. You can See this for advanced examples


<br />
<br />
<h3>ChangeLog</h3>
<h4>v3.0</h4>
- Changed *kernel in VertexFragmentPrograms(VFP) to *attr for indicate arguments of type "attributes". <br />
*attr in vertex programs of VFP only allow get the same/current ID value (type attribute): <br />
main(float4*attr nodeVertexCoord) { <br />
    vec4 nvc = nodeVertexCoord[]; <br />
} <br />
* in vertex programs of VFP allow to get another ID (type sampler2D) (for to get a node data or a texture data) <br />
main(float4* nodePosition) { <br />
    vec2 x = get_global_id(ID, bufferWidth, geometryLength); <br />
    vec4 np = nodePosition[x]; <br />
} <br />
(arguments type sampler2D (no attribute) allow be writed by a kernel program) <br />
 <br />
 <br />
- Deleted optional geometryLength argument in enqueueNDRangeKernel & enqueueVertexFragmentProgram. It is indicated through glsl code with next available methods: <br />
get_global_id(ID, bufferWidth, geometryLength) (in Kernels & vertex of VFP) (The last get_global_id(ID) is removed) <br />
get_global_id(vec2(row, col), bufferWidth) (in Kernels & fragment of VFP) <br />
get_global_id() (only in Kernels fot to get) <br />
 <br />
Changed method setUpdateFromKernel to setAllowKernelWriting in WebCLGLWork <br />

