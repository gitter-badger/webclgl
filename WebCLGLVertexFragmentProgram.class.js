/**
* WebCLGLVertexFragmentProgram Object
* @class
* @constructor
*/
WebCLGLVertexFragmentProgram = function(gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
    "use strict";
    
	var _gl = gl;
	var highPrecisionSupport = _gl.getShaderPrecisionFormat(_gl.FRAGMENT_SHADER, _gl.HIGH_FLOAT);
	var _precision = (highPrecisionSupport.precision != 0) ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

	var _utils = new WebCLGLUtils();

    var _vertexHead;
	var _vertexSource;
	var _fragmentHead;
	var _fragmentSource;

	this.in_vertex_values = [];
	this.in_fragment_values = [];

	this.vertexAttributes = []; // {location,value}
	this.vertexUniforms = []; // {location,value}
	this.fragmentSamplers = []; // {location,value}
	this.fragmentUniforms = []; // {location,value}


    /** @private **/
    var compileVertexFragmentSource = (function() {
        var lines_vertex_attrs = (function() {
            var str = '';
            for(var n = 0, f = this.in_vertex_values.length; n < f; n++) {
                if(this.in_vertex_values[n].type == 'buffer_float4_fromKernel' || this.in_vertex_values[n].type == 'buffer_float_fromKernel') {
                    str += 'uniform sampler2D '+this.in_vertex_values[n].name+';\n';
                } else if(this.in_vertex_values[n].type == 'buffer_float4') {
                    str += 'attribute vec4 '+this.in_vertex_values[n].name+';\n';
                } else if(this.in_vertex_values[n].type == 'buffer_float') {
                    str += 'attribute float '+this.in_vertex_values[n].name+';\n';
                } else if(this.in_vertex_values[n].type == 'float') {
                    str += 'uniform float '+this.in_vertex_values[n].name+';\n';
                } else if(this.in_vertex_values[n].type == 'float4') {
                    str += 'uniform vec4 '+this.in_vertex_values[n].name+';\n';
                } else if(this.in_vertex_values[n].type == 'mat4') {
                    str += 'uniform mat4 '+this.in_vertex_values[n].name+';\n';
                }
            }
            return str;
        }).bind(this);

        var lines_fragment_attrs = (function() {
            var str = '';
            for(var n = 0, f = this.in_fragment_values.length; n < f; n++) {
                if(this.in_fragment_values[n].type == 'buffer_float4' || this.in_fragment_values[n].type == 'buffer_float') {
                    str += 'uniform sampler2D '+this.in_fragment_values[n].name+';\n';
                } else if(this.in_fragment_values[n].type == 'float') {
                    str += 'uniform float '+this.in_fragment_values[n].name+';\n';
                } else if(this.in_fragment_values[n].type == 'float4') {
                    str += 'uniform vec4 '+this.in_fragment_values[n].name+';\n';
                } else if(this.in_fragment_values[n].type == 'mat4') {
                    str += 'uniform mat4 '+this.in_fragment_values[n].name+';\n';
                }
            }
            return str;
        }).bind(this);


        var sourceVertex = 	_precision+
            'uniform float uOffset;\n'+
            'uniform float uBufferWidth;'+
            'uniform float uGeometryLength;'+

            lines_vertex_attrs()+

            _utils.unpackGLSLFunctionString()+

            'vec4 buffer_float4_fromKernel_data(sampler2D arg, vec2 coord) {\n'+
            'vec4 textureColor = texture2D(arg, coord);\n'+
            'return textureColor;\n'+
            '}\n'+
            'float buffer_float_fromKernel_data(sampler2D arg, vec2 coord) {\n'+
            'vec4 textureColor = texture2D(arg, coord);\n'+
            'return textureColor.x;\n'+
            '}\n'+

            'vec2 get_global_id() {\n'+
            'return vec2(0.0, 0.0);\n'+
            '}\n'+

            'vec2 get_global_id(float id) {\n'+
            'float num = (id*uGeometryLength)/uBufferWidth;'+
            'float column = fract(num)*uBufferWidth;'+
            'float row = floor(num);'+

            'float ts = 1.0/(uBufferWidth-1.0);'+
            'float xx = column*ts;'+
            'float yy = row*ts;'+

            'return vec2(xx, yy);'+
            '}\n'+

            _vertexHead+

            'void main(void) {\n'+

            _vertexSource+

            '}\n';
        //console.log(sourceVertex);
        var sourceFragment = _precision+

            lines_fragment_attrs()+

            'vec4 buffer_float4_data(sampler2D arg, vec2 coord) {\n'+
            'vec4 textureColor = texture2D(arg, coord);\n'+
            'return textureColor;\n'+
            '}\n'+
            'float buffer_float_data(sampler2D arg, vec2 coord) {\n'+
            'vec4 textureColor = texture2D(arg, coord);\n'+
            'return textureColor.x;\n'+
            '}\n'+

            'vec2 get_global_id() {\n'+
            'return vec2(0.0, 0.0);\n'+
            '}\n'+

            _fragmentHead+

            'void main(void) {\n'+

            _fragmentSource+

            '}\n';
        //console.log(sourceFragment);

        this.vertexFragmentProgram = _gl.createProgram();
        _utils.createShader(_gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);


        this.vertexAttributes = []; // {location,value}
        this.vertexUniforms = []; // {location,value}
        this.fragmentSamplers = []; // {location,value}
        this.fragmentUniforms = []; // {location,value}

        this.uOffset = _gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
        this.uBufferWidth = _gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");
        this.uGeometryLength = _gl.getUniformLocation(this.vertexFragmentProgram, "uGeometryLength");

        // vertexAttributes & vertexUniforms
        for(var n = 0, f = this.in_vertex_values.length; n < f; n++) {
            if(this.in_vertex_values[n].type == 'buffer_float_fromKernel' || this.in_vertex_values[n].type == 'buffer_float4_fromKernel') {
                this.vertexAttributes.push({	location: [_gl.getUniformLocation(this.vertexFragmentProgram, this.in_vertex_values[n].name)],
                    value: this.in_vertex_values[n].value,
                    type: this.in_vertex_values[n].type,
                    name: this.in_vertex_values[n].name});

                this.in_vertex_values[n].idPointer = this.vertexAttributes.length-1;
            } else if(this.in_vertex_values[n].type == 'buffer_float4' || this.in_vertex_values[n].type == 'buffer_float') {
                this.vertexAttributes.push({	location: [_gl.getAttribLocation(this.vertexFragmentProgram, this.in_vertex_values[n].name)],
                    value: this.in_vertex_values[n].value,
                    type: this.in_vertex_values[n].type,
                    name: this.in_vertex_values[n].name});

                this.in_vertex_values[n].idPointer = this.vertexAttributes.length-1;
            } else if(this.in_vertex_values[n].type == 'float' || this.in_vertex_values[n].type == 'float4' || this.in_vertex_values[n].type == 'mat4') {
                this.vertexUniforms.push({	location: [_gl.getUniformLocation(this.vertexFragmentProgram, this.in_vertex_values[n].name)],
                    value: this.in_vertex_values[n].value,
                    type: this.in_vertex_values[n].type,
                    name: this.in_vertex_values[n].name});

                this.in_vertex_values[n].idPointer = this.vertexUniforms.length-1;
            }
        }

        // fragmentSamplers & fragmentUniforms
        for(var n = 0, f = this.in_fragment_values.length; n < f; n++) {
            if(this.in_fragment_values[n].type == 'buffer_float4' || this.in_fragment_values[n].type == 'buffer_float') {
                this.fragmentSamplers.push({	location: [_gl.getUniformLocation(this.vertexFragmentProgram, this.in_fragment_values[n].name)],
                    value: this.in_fragment_values[n].value,
                    type: this.in_fragment_values[n].type,
                    name: this.in_fragment_values[n].name});

                this.in_fragment_values[n].idPointer = this.fragmentSamplers.length-1;
            } else if(this.in_fragment_values[n].type == 'float' || this.in_fragment_values[n].type == 'float4' || this.in_fragment_values[n].type == 'mat4') {
                this.fragmentUniforms.push({	location: [_gl.getUniformLocation(this.vertexFragmentProgram, this.in_fragment_values[n].name)],
                    value: this.in_fragment_values[n].value,
                    type: this.in_fragment_values[n].type,
                    name: this.in_fragment_values[n].name});

                this.in_fragment_values[n].idPointer = this.fragmentUniforms.length-1;
            }
        }


        return true;
    }).bind(this);

    /**
     * Update the vertex source
     * @type Void
     * @param {String} vertexSource
     * @param {String} vertexHeader
     */
    this.setVertexSource = function(vertexSource, vertexHeader) {
        /** @private **/
        var parseVertexSource = (function(source) {
            //console.log(source);
            for(var n = 0, f = this.in_vertex_values.length; n < f; n++) { // for each in_vertex_values (in argument)
                var regexp = new RegExp(this.in_vertex_values[n].name+'\\[\\w*\\]',"gm");
                var varMatches = source.match(regexp);// "Search current "in_vertex_values.name[xxx]" in source and store in array varMatches
                //console.log(varMatches);
                if(varMatches != null) {
                    for(var nB = 0, fB = varMatches.length; nB < fB; nB++) { // for each varMatches ("A[x]", "A[x]")
                        var regexpNativeGL = new RegExp('```(\s|\t)*gl.*'+varMatches[nB]+'.*```[^```(\s|\t)*gl]',"gm");
                        var regexpNativeGLMatches = source.match(regexpNativeGL);
                        if(regexpNativeGLMatches == null) {
                            var name = varMatches[nB].split('[')[0];
                            var vari = varMatches[nB].split('[')[1].split(']')[0];
                            var regexp = new RegExp(name+'\\['+vari.trim()+'\\]',"gm");

                            if(this.in_vertex_values[n].type == 'buffer_float4_fromKernel')
                                source = source.replace(regexp, 'buffer_float4_fromKernel_data('+name+','+vari+')');
                            if(this.in_vertex_values[n].type == 'buffer_float_fromKernel')
                                source = source.replace(regexp, 'buffer_float_fromKernel_data('+name+','+vari+')');
                            if(this.in_vertex_values[n].type == 'buffer_float4')
                                source = source.replace(regexp, name);
                            if(this.in_vertex_values[n].type == 'buffer_float')
                                source = source.replace(regexp, name);
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
            return source;
        }).bind(this);


        _vertexHead =(vertexHeader!=undefined)?vertexHeader:'';
        this.in_vertex_values = [];//{value,type,name,idPointer}
        // value: argument value
        // type: 'buffer_float4_fromKernel'(4 packet pointer4), 'buffer_float_fromKernel'(1 packet pointer4), 'buffer_float4'(1 pointer4), 'buffer_float'(1 pointer1)
        // name: argument name
        // idPointer to: this.vertexAttributes or this.vertexUniforms (according to type)

        var argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*kernel/gm) != null) {
                if(argumentsSource[n].match(/float4/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'buffer_float4_fromKernel',
                        name:argumentsSource[n].split('*kernel')[1].trim()};
                } else if(argumentsSource[n].match(/float/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'buffer_float_fromKernel',
                        name:argumentsSource[n].split('*kernel')[1].trim()};
                }
            } else if(argumentsSource[n].match(/\*/gm) != null) {
                if(argumentsSource[n].match(/float4/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'buffer_float4',
                        name:argumentsSource[n].split('*')[1].trim()};
                } else if(argumentsSource[n].match(/float/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'buffer_float',
                        name:argumentsSource[n].split('*')[1].trim()};
                }
            } else {
                if(argumentsSource[n].match(/float4/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'float4',
                        name:argumentsSource[n].split(' ')[1].trim()};
                } else if(argumentsSource[n].match(/float/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'float',
                        name:argumentsSource[n].split(' ')[1].trim()};
                } else if(argumentsSource[n].match(/mat4/gm) != null) {
                    this.in_vertex_values[n] = {	value:undefined,
                        type:'mat4',
                        name:argumentsSource[n].split(' ')[1].trim()};
                }
            }
        }
        //console.log(this.in_vertex_values);

        // parse header
        _vertexHead = _vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexHead = parseVertexSource(_vertexHead);

        // parse source
        //console.log('original source: '+vertexSource);
        _vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexSource = _vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_vertexSource);
        _vertexSource = parseVertexSource(_vertexSource);

        if(_fragmentSource != undefined)
            compileVertexFragmentSource();
    };
    if(vertexSource != undefined)
        this.setVertexSource(vertexSource, vertexHeader);



    /**
     * Update the fragment source
     * @type Void
     * @param {String} fragmentSource
     * @param {String} fragmentHeader
     */
    this.setFragmentSource = function(fragmentSource, fragmentHeader) {
        /** @private **/
        var parseFragmentSource = (function(source) {
            //console.log(source);
            for(var n = 0, f = this.in_fragment_values.length; n < f; n++) { // for each in_fragment_values (in argument)
                var regexp = new RegExp(this.in_fragment_values[n].name+'\\[\\w*\\]',"gm");
                var varMatches = source.match(regexp);// "Search current "in_fragment_values.name[xxx]" in source and store in array varMatches
                //console.log(varMatches);
                if(varMatches != null) {
                    for(var nB = 0, fB = varMatches.length; nB < fB; nB++) { // for each varMatches ("A[x]", "A[x]")
                        var regexpNativeGL = new RegExp('```(\s|\t)*gl.*'+varMatches[nB]+'.*```[^```(\s|\t)*gl]',"gm");
                        var regexpNativeGLMatches = source.match(regexpNativeGL);
                        if(regexpNativeGLMatches == null) {
                            var name = varMatches[nB].split('[')[0];
                            var vari = varMatches[nB].split('[')[1].split(']')[0];
                            var regexp = new RegExp(name+'\\['+vari.trim()+'\\]',"gm");

                            if(this.in_fragment_values[n].type == 'buffer_float4')
                                source = source.replace(regexp, 'buffer_float4_data('+name+','+vari+')');
                            if(this.in_fragment_values[n].type == 'buffer_float')
                                source = source.replace(regexp, 'buffer_float_data('+name+','+vari+')');
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
            return source;
        }).bind(this);


        _fragmentHead =(fragmentHeader!=undefined)?fragmentHeader:'';
        this.in_fragment_values = [];//{value,type,name,idPointer}
        // value: argument value
        // type: 'buffer_float4'(RGBA channels), 'buffer_float'(Red channel)
        // name: argument name
        // idPointer to: this.fragmentSamplers or this.fragmentUniforms (according to type)

        var argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                if(argumentsSource[n].match(/float4/gm) != null) {
                    this.in_fragment_values[n] = {	value:undefined,
                        type:'buffer_float4',
                        name:argumentsSource[n].split('*')[1].trim()};
                } else if(argumentsSource[n].match(/float/gm) != null) {
                    this.in_fragment_values[n] = {	value:undefined,
                        type:'buffer_float',
                        name:argumentsSource[n].split('*')[1].trim()};
                }
            } else {
                if(argumentsSource[n].match(/float4/gm) != null) {
                    this.in_fragment_values[n] = {	value:undefined,
                        type:'float4',
                        name:argumentsSource[n].split(' ')[1].trim()};
                } else if(argumentsSource[n].match(/float/gm) != null) {
                    this.in_fragment_values[n] = {	value:undefined,
                        type:'float',
                        name:argumentsSource[n].split(' ')[1].trim()};
                } else if(argumentsSource[n].match(/mat4/gm) != null) {
                    this.in_fragment_values[n] = {	value:undefined,
                        type:'mat4',
                        name:argumentsSource[n].split(' ')[1].trim()};
                }
            }
        }
        //console.log(this.in_fragment_values);

        // parse header
        _fragmentHead = _fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentHead = parseFragmentSource(_fragmentHead);

        // parse source
        //console.log('original source: '+source);
        _fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentSource = _fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_fragmentSource);
        _fragmentSource = parseFragmentSource(_fragmentSource);

        if(_vertexSource != undefined)
            compileVertexFragmentSource();
    };
    if(fragmentSource != undefined)
        this.setFragmentSource(fragmentSource, fragmentHeader);


















    /**
     * Bind float, mat4 or a WebCLGLBuffer to a vertex argument
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer} data
     */
    this.setVertexArg = function(argument, data) {
        if(data == undefined) alert("Error: setVertexArg("+argument+", undefined)");

        var numArg;
        if(typeof argument != "string") {
            numArg = argument;
        } else {
            for(var n=0, fn = this.in_vertex_values.length; n < fn; n++) {
                if(this.in_vertex_values[n].name == argument) {
                    numArg = n;
                    break;
                }
            }
        }

        if(this.in_vertex_values[numArg] == undefined) {
            console.log("argument "+argument+" not exist in this vertex program");
            return;
        }
        this.in_vertex_values[numArg].value = data;

        if(	this.in_vertex_values[numArg].type == 'buffer_float4_fromKernel' ||
            this.in_vertex_values[numArg].type == 'buffer_float_fromKernel' ||
            this.in_vertex_values[numArg].type == 'buffer_float4' ||
            this.in_vertex_values[numArg].type == 'buffer_float') {
            this.vertexAttributes[this.in_vertex_values[numArg].idPointer].value = this.in_vertex_values[numArg].value;
        } else if(this.in_vertex_values[numArg].type == 'float' || this.in_vertex_values[numArg].type == 'float4' || this.in_vertex_values[numArg].type == 'mat4') {
            this.vertexUniforms[this.in_vertex_values[numArg].idPointer].value = this.in_vertex_values[numArg].value;
        }
    };

    /**
     * Bind float or a WebCLGLBuffer to a fragment argument
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer} data
     */
    this.setFragmentArg = function(argument, data) {
        if(data == undefined) alert("Error: setFragmentArg("+argument+", undefined)");

        var numArg;
        if(typeof argument != "string") {
            numArg = argument;
        } else {
            for(var n=0, fn = this.in_fragment_values.length; n < fn; n++) {
                if(this.in_fragment_values[n].name == argument) {
                    numArg = n;
                    break;
                }
            }
        }

        if(this.in_fragment_values[numArg] == undefined) {
            console.log("argument "+argument+" not exist in this fragment program");
            return;
        }
        this.in_fragment_values[numArg].value = data;

        if(this.in_fragment_values[numArg].type == 'buffer_float4' || this.in_fragment_values[numArg].type == 'buffer_float') {
            this.fragmentSamplers[this.in_fragment_values[numArg].idPointer].value = this.in_fragment_values[numArg].value;
        } else if(this.in_fragment_values[numArg].type == 'float' || this.in_fragment_values[numArg].type == 'float4' || this.in_fragment_values[numArg].type == 'mat4') {
            this.fragmentUniforms[this.in_fragment_values[numArg].idPointer].value = this.in_fragment_values[numArg].value;
        }
    };
};


