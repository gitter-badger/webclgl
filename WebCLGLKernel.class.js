/**
* WebCLGLKernel Object
* @class
* @constructor
*/
WebCLGLKernel = function(gl, source, header) {
    "use strict";

	var _gl = gl;
	var highPrecisionSupport = _gl.getShaderPrecisionFormat(_gl.FRAGMENT_SHADER, _gl.HIGH_FLOAT);
	var _precision = (highPrecisionSupport.precision != 0) ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

	this.in_values = {};

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

    /**
     * Update the kernel source
     * @type Void
     * @param {String} source
     * @param {String} [header=undefined] Additional functions
     */
    this.setKernelSource = function(source, header) {
        /**
         * @private
         */
        var parse = (function(source) {
            //console.log(source);
            for(var key in this.in_values) { // for each in_values (in argument)
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

                            if(this.in_values[key].type == 'float4_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+')');
                            if(this.in_values[key].type == 'float_fromSampler')
                                source = source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+').x');
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
            return source;
        }).bind(this);

        /**
         * @private
         */
        var compile = (function() {
            var lines_attrs = (function() {
                var str = '';
                for(var key in this.in_values) {
                    if(this.in_values[key].type == 'float4_fromSampler' || this.in_values[key].type == 'float_fromSampler')
                        str += 'uniform sampler2D '+key+';\n';
                    else if(this.in_values[key].type == 'float')
                        str += 'uniform float '+key+';\n';
                    else if(this.in_values[key].type == 'float4')
                        str += 'uniform vec4 '+key+';\n';
                    else if(this.in_values[key].type == 'mat4')
                        str += 'uniform mat4 '+key+';\n';
                }
                return str;
            }).bind(this);

            var sourceVertex = 	_precision+
                'attribute vec3 aVertexPosition;\n'+
                'attribute vec2 aTextureCoord;\n'+

                'varying vec2 global_id;\n'+

                'void main(void) {\n'+
                    'gl_Position = vec4(aVertexPosition, 1.0);\n'+
                    'global_id = aTextureCoord;\n'+
                '}\n';
            var sourceFragment = _precision+

                lines_attrs()+

                'varying vec2 global_id;\n'+
                'uniform float uBufferWidth;'+

                'vec2 get_global_id() {\n'+
                    'return global_id;\n'+
                '}\n'+

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

                _head+

                'void main(void) {\n'+
                    'float out_float = -999.99989;\n'+
                    'vec4 out_float4;\n'+

                    _source;



            var sourceFrag = sourceFragment+
                'if(out_float != -999.99989) gl_FragColor = vec4(out_float,0.0,0.0,1.0);\n'+
                'else gl_FragColor = out_float4;\n'+
                '}\n';


            //this.kernelPrograms = [	new WebCLGLKernelProgram(_gl, sourceVertex, sourceFrag, this.in_values) ];

            this.kernel = _gl.createProgram();
            new WebCLGLUtils().createShader(_gl, "WEBCLGL", sourceVertex, sourceFrag, this.kernel);
            //console.log(sourceF);


            this.attr_VertexPos = _gl.getAttribLocation(this.kernel, "aVertexPosition");
            this.attr_TextureCoord = _gl.getAttribLocation(this.kernel, "aTextureCoord");

            this.uBufferWidth = _gl.getUniformLocation(this.kernel, "uBufferWidth");

            for(var key in this.in_values) {
                var expectedMode;
                if(this.in_values[key].type == 'float4_fromSampler' || this.in_values[key].type == 'float_fromSampler')
                    expectedMode = "SAMPLER";
                else if(this.in_values[key].type == 'float' || this.in_values[key].type == 'float4' || this.in_values[key].type == 'mat4')
                    expectedMode = "UNIFORM";

                checkArgNameInitialization(this.in_values, key);
                this.in_values[key].location = [_gl.getUniformLocation(this.kernel, key)];
                this.in_values[key].expectedMode = expectedMode;
            }

            return true;
        }).bind(this);


        var argumentsSource = source.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_values);

        // parse header
        var _head =(header!=undefined)?header:'';
        _head = _head.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _head = parse(_head);

        // parse source
        //console.log('original source: '+source);
        var _source = source.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _source = _source.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_source);
        _source = parse(_source);

        compile();
    };
    if(source != undefined)
        this.setKernelSource(source, header);



    /**
     * Bind float or a WebCLGLBuffer to a kernel argument
     * @type Void
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer} data
     */
    this.setKernelArg = function(argument, data) {
        if(data == undefined) alert("Error in setKernelArg("+argument+", data) (data is undefined)");
		
		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_values)[argument];
        this.in_values[arg].value = data;
    };
};


