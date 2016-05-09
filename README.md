webclgl
=======
<h2>Javascript Library for general purpose computing on GPU, aka GPGPU.</h2>
WebCLGL use a code style like WebCL for handle the operations (more understandable that WebGL if not is for 3D graphics end) and which then translates to WebGL code.<br />
Not 100% the same as the future <a href="https://en.wikipedia.org/wiki/WebCL">WebCL specification</a> nor has all its advantages. Some limitations are:<br />
- Writing over multiple buffers in a single kernel.<br />
- Read and write a buffer at same time. (In this case you must create a temporary buffer for the writing and later fix the changes with the webCLGL.copy function)<br />

<h3>Now only one dependency is required</h3>
```html
<script src="/js/WebCLGL.class.js"></script>
```

<h3>gpufor function now available. Make less to further facilitate the convert of your code for to use in GPU</h3>
```js
var arrayResult = gpufor({"float* A": arrayA, "float* B": arrayB}, "n",
                          "float sum = A[n]+B[n];"+
                          "return sum;");

```
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/gpufor/index.html"> gpufor basic example A+B</a><br />

<h3>Other specifics demos (without use gpufor function)</h3>
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB/index.html"> Basic example A+B</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB_and_number/index.html"> Basic example A+B+num</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/benchmarks/index.html"> Benchmarks</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors/index.html"> Using vectors</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors_as_output/index.html"> Using vectors as output</a><br />

<h3>Other advanced demos</h3>
- <a href="#"> Handling several WebCLGLKernels with WebCLGLWork class</a> (coming soon)<br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/WebCLGLWork_3D_graphics/index.html"> Graphic output using WebCLGLWork (for to handle several WebCLGLKernels, WebCLGLVertexFragmentProgram & WebCLGLBuffer)</a> <br />
- <a href="https://github.com/stormcolor/SCEJS"> SCEJS</a> use WebCLGL as low level layer. You can See this for advanced examples

<h3><a href="https://rawgit.com/stormcolor/webclgl/master/APIdoc/APIdoc/WebCLGL.html">API Doc WebCLGL</a></h3>
<h3><a href="http://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf">OpenGL ES Shading Language 1.0 Reference Card (Pag 3-4)</a></h3>
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

