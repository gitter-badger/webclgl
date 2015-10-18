webclgl
=======
<h2>Javascript Library for general purpose computing on GPU, aka GPGPU.</h2>
WebCLGL use a code style like WebCL for handle the operations (more understandable that WebGL if not is for 3D graphics end) and which then translates to WebGL code.<br />
Not 100% the same as the future <a href="https://en.wikipedia.org/wiki/WebCL">WebCL specification</a> nor has all its advantages. Some limitations are:<br />
- Writing over multiple buffers in a single kernel.<br />
- Read and write a buffer at same time. (In this case you must create a temporary buffer for the writing and later fix the changes with the webCLGL.copy function.)<br />

<h3>Demos</h3>
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB/index.html"> Basic example A+B</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/basic_sum_AB_and_number/index.html"> Basic example A+B+num</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/benchmarks/index.html"> Benchmarks</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors/index.html"> Using vectors</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/using_vectors_as_output/index.html"> Using vectors as output</a><br />
- <a href="https://rawgit.com/stormcolor/webclgl/master/demos/compare_values_with_other_ids/index.html"> Compare values with other ids</a><br />


<h3><a href="https://rawgit.com/stormcolor/webclgl/master/APIdoc/APIdoc/WebCLGL.html">API Doc WebCLGL 2.0</a></h3>
<h3><a href="http://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf">OpenGL ES Shading Language 1.0 Reference Card (Pag 3-4)</a></h3>
<br />
<br />

<h3>Changelog</h3>
v2.2 (Oct 10, 2015) <br />
- Added new class WebCLGLBufferItem <br />
- Added split option in buffers for allow internal big lengths <br />
- Fixed minor bugs from last version <br />
v2.1 (Oct 10, 2015) <br />
- Added new class WebCLGLVertexFragmentProgram <br />
- Fixed bug when enqueueReadBuffer FLOAT4 <br />
- enqueueReadBuffer_Float4_Packet4Uint8Array renamed to enqueueReadBuffer_Packet4Uint8Array_Float4 <br />
<br />
