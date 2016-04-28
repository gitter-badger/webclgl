/** 
* WebCLGLKernelProgram Object
* @class
* @constructor
*/
WebCLGLKernelProgram = function(gl, sv, sf, in_values) {
    "use strict";
    
	var _gl = gl;
	
	this.kernel = _gl.createProgram();
    new WebCLGLUtils().createShader(_gl, "WEBCLGL", sv, sf, this.kernel);
	//console.log(sourceF);	
	
	this.samplers = []; // {location,value}
	this.uniforms = []; // {location,value}
	this.attr_VertexPos = _gl.getAttribLocation(this.kernel, "aVertexPosition");
	this.attr_TextureCoord = _gl.getAttribLocation(this.kernel, "aTextureCoord");	

	this.uBufferWidth = _gl.getUniformLocation(this.kernel, "uBufferWidth");
	this.uGeometryLength = _gl.getUniformLocation(this.kernel, "uGeometryLength");
	
	for(var n = 0, f = in_values.length; n < f; n++) {
		if(in_values[n].type == 'buffer_float4' || in_values[n].type == 'buffer_float') {
			this.samplers.push({	location: [_gl.getUniformLocation(this.kernel, in_values[n].name)],
									value:in_values[n].value,
									type: in_values[n].type,
									name: in_values[n].name});
			
			in_values[n].idPointer = this.samplers.length-1;
		} else if(in_values[n].type == 'float' || in_values[n].type == 'float4' || in_values[n].type == 'mat4') {
			this.uniforms.push({	location: [_gl.getUniformLocation(this.kernel, in_values[n].name)],
									value:in_values[n].value,
									type: in_values[n].type,
									name: in_values[n].name});
			
			in_values[n].idPointer = this.uniforms.length-1;
		}
	}
};