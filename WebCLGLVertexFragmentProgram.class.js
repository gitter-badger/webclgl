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

	this.in_vertex_values = {};
	this.in_fragment_values = {};

	var _vertexP_ready = false;
    var _fragmentP_ready = false;

    var _vertexHead;
    var _vertexSource;
    var _fragmentHead;
    var _fragmentSource;

    var _enableDebug = false;

    /**
     * checkArgNameInitialization
     * @param {Object} inValues
     * @param {String} argName
     * @private
     */
    var checkArgNameInitialization = (function(inValues, argName) {
        if(inValues.hasOwnProperty(argName) == false) {
            var inValue = { "type": null, //
                            "expectedMode": null, // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                            "value": null, // Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer
                            "location": null};
            inValues[argName] = inValue;
        }
    }).bind(this);

    /** @private **/
    var compileVertexFragmentSource = (function() {
        var lines_vertex_attrs = (function() {
            var str = '';
            for(var key in this.in_vertex_values) {
                if(this.in_vertex_values[key].type == 'float4_fromSampler' || this.in_vertex_values[key].type == 'float_fromSampler')
                    str += 'uniform sampler2D '+key+';\n';
                else if(this.in_vertex_values[key].type == 'float4_fromAttr')
                    str += 'attribute vec4 '+key+';\n';
                else if(this.in_vertex_values[key].type == 'float_fromAttr')
                    str += 'attribute float '+key+';\n';
                else if(this.in_vertex_values[key].type == 'float')
                    str += 'uniform float '+key+';\n';
                else if(this.in_vertex_values[key].type == 'float4')
                    str += 'uniform vec4 '+key+';\n';
                else if(this.in_vertex_values[key].type == 'mat4')
                    str += 'uniform mat4 '+key+';\n';
            }
            return str;
        }).bind(this);

        var lines_fragment_attrs = (function() {
            var str = '';
            for(var key in this.in_fragment_values) {
                if(this.in_fragment_values[key].type == 'float4_fromSampler' || this.in_fragment_values[key].type == 'float_fromSampler')
                    str += 'uniform sampler2D '+key+';\n';
                else if(this.in_fragment_values[key].type == 'float')
                    str += 'uniform float '+key+';\n';
                else if(this.in_fragment_values[key].type == 'float4')
                    str += 'uniform vec4 '+key+';\n';
                else if(this.in_fragment_values[key].type == 'mat4')
                    str += 'uniform mat4 '+key+';\n';
            }
            return str;
        }).bind(this);


        var sourceVertex = 	_precision+
            'uniform float uOffset;\n'+
            'uniform float uBufferWidth;'+

            lines_vertex_attrs()+

            _utils.unpackGLSLFunctionString()+

            'vec2 get_global_id(float id, float bufferWidth, float geometryLength) {\n'+
                'float num = (id*geometryLength)/bufferWidth;'+
                'float column = fract(num)*bufferWidth;'+
                'float row = floor(num);'+

                'float ts = 1.0/(bufferWidth-1.0);'+

                'return vec2(column*ts, row*ts);'+
            '}\n'+

            'vec2 get_global_id(vec2 id, float bufferWidth) {\n'+
                'float column = id.x;'+
                'float row = id.y;'+

                'float ts = 1.0/(bufferWidth-1.0);'+

                'return vec2(column*ts, row*ts);'+
            '}\n'+

            _vertexHead+

            'void main(void) {\n'+

            _vertexSource+

            '}\n';
        //console.log(sourceVertex);
        var sourceFragment = _precision+

            lines_fragment_attrs()+

            _fragmentHead+

            'void main(void) {\n'+

            _fragmentSource+

            '}\n';
        //console.log(sourceFragment);

        this.vertexFragmentProgram = _gl.createProgram();
        var result = _utils.createShader(_gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);
        if(result == true && _enableDebug == true)
            console.log("WEBCLGL VERTEX FRAGMENT PROGRAM\n "+sourceVertex+"\n "+sourceFragment);


        this.uOffset = _gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
        this.uBufferWidth = _gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");

        for(var key in this.in_vertex_values) {
            var expectedMode;
            if(this.in_vertex_values[key].type == 'float_fromSampler' || this.in_vertex_values[key].type == 'float4_fromSampler')
                expectedMode = "SAMPLER";
             else if(this.in_vertex_values[key].type == 'float4_fromAttr' || this.in_vertex_values[key].type == 'float_fromAttr')
                expectedMode = "ATTRIBUTE";
             else if(this.in_vertex_values[key].type == 'float' || this.in_vertex_values[key].type == 'float4' || this.in_vertex_values[key].type == 'mat4')
                expectedMode = "UNIFORM";

            checkArgNameInitialization(this.in_vertex_values, key);
            var loc = (expectedMode == "ATTRIBUTE") ? gl.getAttribLocation(this.vertexFragmentProgram, key) : gl.getUniformLocation(this.vertexFragmentProgram, key);
            this.in_vertex_values[key].location = [loc];
            this.in_vertex_values[key].expectedMode = expectedMode;
        }

        for(var key in this.in_fragment_values) {
            var expectedMode;
            if(this.in_fragment_values[key].type == 'float4_fromSampler' || this.in_fragment_values[key].type == 'float_fromSampler')
                expectedMode = "SAMPLER";
            else if(this.in_fragment_values[key].type == 'float' || this.in_fragment_values[key].type == 'float4' || this.in_fragment_values[key].type == 'mat4')
                expectedMode = "UNIFORM";

            checkArgNameInitialization(this.in_fragment_values, key);
            this.in_fragment_values[key].location = [_gl.getUniformLocation(this.vertexFragmentProgram, key)];
            this.in_fragment_values[key].expectedMode = expectedMode;
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
            for(var key in this.in_vertex_values) { // for each in_vertex_values (in argument)
                var regexp = new RegExp(key+"\\[.*?\\]","gm");
                var varMatches = source.match(regexp);// "Search current "argName" in source and store in array varMatches
                //console.log(varMatches);
                if(varMatches != null) {
                    for(var nB = 0, fB = varMatches.length; nB < fB; nB++) { // for each varMatches ("A[x]", "A[x]")
                        var regexpNativeGL = new RegExp('```(\s|\t)*gl.*'+varMatches[nB]+'.*```[^```(\s|\t)*gl]',"gm");
                        var regexpNativeGLMatches = source.match(regexpNativeGL);
                        if(regexpNativeGLMatches == null) {
                            var name = varMatches[nB].split('[')[0];
                            var vari = varMatches[nB].split('[')[1].split(']')[0];

                            if(this.in_vertex_values[key].type == 'float4_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+')');
                            if(this.in_vertex_values[key].type == 'float_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+').x');
                            if(this.in_vertex_values[key].type == 'float4_fromAttr')
                                source = source.replace(name+"["+vari+"]", name);
                            if(this.in_vertex_values[key].type == 'float_fromAttr')
                                source = source.replace(name+"["+vari+"]", name);
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
            return source;
        }).bind(this);


        var argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*attr/gm) != null) {
                var argName = argumentsSource[n].split('*attr')[1].trim();
                checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromAttr';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromAttr';
            } else if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_vertex_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_vertex_values);

        // parse header
        _vertexHead =(vertexHeader!=undefined)?vertexHeader:'';
        _vertexHead = _vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexHead = parseVertexSource(_vertexHead);

        // parse source
        //console.log('original source: '+vertexSource);
        _vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexSource = _vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_vertexSource);
        _vertexSource = parseVertexSource(_vertexSource);

        _vertexP_ready = true;
        if(_fragmentP_ready == true)
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
            for(var key in this.in_fragment_values) { // for each in_fragment_values (in argument)
                var regexp = new RegExp(key+"\\[.*?\\]","gm");
                var varMatches = source.match(regexp);// "Search current "argName" in source and store in array varMatches
                //console.log(varMatches);
                if(varMatches != null) {
                    for(var nB = 0, fB = varMatches.length; nB < fB; nB++) { // for each varMatches ("A[x]", "A[x]")
                        var regexpNativeGL = new RegExp('```(\s|\t)*gl.*'+varMatches[nB]+'.*```[^```(\s|\t)*gl]',"gm");
                        var regexpNativeGLMatches = source.match(regexpNativeGL);
                        if(regexpNativeGLMatches == null) {
                            var name = varMatches[nB].split('[')[0];
                            var vari = varMatches[nB].split('[')[1].split(']')[0];

                            if(this.in_fragment_values[key].type == 'float4_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+')');
                            if(this.in_fragment_values[key].type == 'float_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+').x');
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
            return source;
        }).bind(this);


        var argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_fragment_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_fragment_values);

        // parse header
        _fragmentHead =(fragmentHeader!=undefined)?fragmentHeader:'';
        _fragmentHead = _fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentHead = parseFragmentSource(_fragmentHead);

        // parse source
        //console.log('original source: '+source);
        _fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentSource = _fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_fragmentSource);
        _fragmentSource = parseFragmentSource(_fragmentSource);

        _fragmentP_ready = true;
        if(_vertexP_ready == true)
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
        if(data == undefined) alert("Error in setVertexArg("+argument+", data) (data is undefined)");

		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_vertex_values)[argument];
        this.in_vertex_values[arg].value = data;
    };

    /**
     * Bind float or a WebCLGLBuffer to a fragment argument
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer} data
     */
    this.setFragmentArg = function(argument, data) {
        if(data == undefined) alert("Error in setFragmentArg("+argument+", data) (data is undefined)");

		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_fragment_values)[argument];
        this.in_fragment_values[arg].value = data;
    };
};


