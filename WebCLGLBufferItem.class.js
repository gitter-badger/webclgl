/**
 * WebCLGLBuffer Object
 * @class
 * @constructor
 * @property {WebGLTexture} textureData
 * @property {Array<Float>} inData Original array
 * @property {Int} [offset=0] offset of buffer
 */
WebCLGLBufferItem = function(gl, length, type, offset, linear, mode) {
    "use strict";

    var _gl = gl;

    if(length.constructor === Array) {
        this.length = length[0]*length[1];
        this.W = length[0];
        this.H = length[1];
    } else {
        this.length = length;
        this.W = Math.ceil(Math.sqrt(this.length));
        this.H = this.W;
    }

    this.type = (type != undefined) ? type : 'FLOAT';
    this._supportFormat = _gl.FLOAT;
    //this._supportFormat = _gl.UNSIGNED_BYTE;

    this.offset = (offset != undefined) ? offset : 0;
    this.linear = (linear != undefined && linear == true) ? true : false;

    var inData; // enqueueWriteBuffer user data

    this.mode = (mode != undefined) ? mode : "FRAGMENT"; // "FRAGMENT", "VERTEX", "VERTEX_INDEX", "VERTEX_FROM_KERNEL", "VERTEX_AND_FRAGMENT"

    // readPixel arrays
    //this.outArray4Uint8ArrayX = new Uint8Array((this.W*this.H)*4);
//	this.outArray4Uint8ArrayY = new Uint8Array((this.W*this.H)*4);
//	this.outArray4Uint8ArrayZ = new Uint8Array((this.W*this.H)*4);
//	this.outArray4Uint8ArrayW = new Uint8Array((this.W*this.H)*4);
    /*this.outArray4x4Uint8Array = new Uint8Array((this.W*this.H)*4*4);*/

//	this.Packet4Uint8Array_Float = []; // [this.outArray4Uint8ArrayX]
//	this.Float = []; // [unpack(this.outArray4Uint8ArrayX)]
//	this.Packet4Uint8Array_Float4 = []; // [this.outArray4Uint8ArrayX, ..Y, ..Z, ..W]
//	this.Float4 = []; // [unpack(this.outArray4Uint8ArrayX), unpack(..Y), unpack(..Z), unpack(..W)]


    // Create FrameBuffer & RenderBuffer
    /*this.rBuffer = _gl.createRenderbuffer();
     _gl.bindRenderbuffer(_gl.RENDERBUFFER, this.rBuffer);
     _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, this.W, this.H);
     _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);

     this.fBuffer = _gl.createFramebuffer();
     _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.fBuffer);
     _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, this.rBuffer);*/

    this.initialize = function() {
        if(this.mode == "FRAGMENT" || this.mode == "VERTEX_FROM_KERNEL" || this.mode == "VERTEX_AND_FRAGMENT") {
            // Create WebGLTexture buffer
            this.textureData = this.createWebGLTextureBuffer();

            if(this.mode == "VERTEX_FROM_KERNEL") {
                //          this.createWebGLRenderBuffer();
//            this.createWebGLFrameBuffer();
            }
        }
        if(this.mode == "VERTEX" || this.mode == "VERTEX_INDEX" || this.mode == "VERTEX_FROM_KERNEL" || this.mode == "VERTEX_AND_FRAGMENT") {
            // Create WebGL buffer
            this.vertexData0 = this.createWebGLBuffer();
        }
    };

    this.createWebGLRenderBuffer = function() {
        this.rBuffer = _gl.createRenderbuffer();
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, this.rBuffer);
        _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, this.W, this.H);
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
    };

    this.createWebGLFrameBuffer = function() {
        this.fBuffer = _gl.createFramebuffer();
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.fBuffer);
        _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, this.rBuffer);
    };

    /**
     * Create the WebGLTexture buffer
     * @type Void
     */
    this.createWebGLTextureBuffer = function() {
        _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
        _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        var textureData = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, textureData);
        if(this.linear != undefined && this.linear == true) {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W,this.H, 0, _gl.RGBA, this._supportFormat, null);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
            _gl.generateMipmap(_gl.TEXTURE_2D);
        } else {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W,this.H, 0, _gl.RGBA, this._supportFormat, null);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
        }

        return textureData;
    };

    /**
     * Create the WebGL buffer
     * @type Void
     */
    this.createWebGLBuffer = function() {
        var vertexData = _gl.createBuffer();

        return vertexData;
    };

    /**
     * Write WebGLTexture buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @type Void
     */
    this.writeWebGLTextureBuffer = function(arr, flip) {
        inData = arr;

        if(arr instanceof WebGLTexture) this.textureData = arr;
        else {
            if(flip == false || flip == undefined)
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
            else
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            _gl.bindTexture(_gl.TEXTURE_2D, this.textureData);
            if(arr instanceof HTMLImageElement)  {
                inData = new WebCLGLUtils().getUint8ArrayFromHTMLImageElement(arr);
                //texImage2D(			target, 			level, 	internalformat, 	format, 		type, 			TexImageSource);
                if(this.type == 'FLOAT4') {
                    _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		_gl.RGBA, 	_gl.FLOAT, 	arr);
                }/* else if(this.type == 'INT4') {
                 _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		_gl.RGBA, 	_gl.UNSIGNED_BYTE, 	arr);
                 }*/
            } else {
                //console.log("Write arr with length of "+arr.length+" in Buffer "+this.type+" with length of "+this.length+" (W: "+this.W+"; H: "+this.H+")");

                if(this.type == 'FLOAT4') {
                    var arrt = new Float32Array((this.W*this.H)*4);
                    for(var n=0; n < arr.length; n++) arrt[n] = arr[n];
                    //texImage2D(			target, 			level, 	internalformat, 	width, height, border, 	format, 		type, 			pixels);
                    if(arr instanceof Uint8Array) {
                        _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		this.W, this.H, 0, 	_gl.RGBA, 	_gl.FLOAT, 	arrt);
                    } else if(arr instanceof Float32Array) {
                        _gl.texImage2D(_gl.TEXTURE_2D, 	0, 		_gl.RGBA, 		this.W, this.H, 0, 	_gl.RGBA, 	_gl.FLOAT, 	arrt);
                    } else {
                        _gl.texImage2D(_gl.TEXTURE_2D, 	0, 		_gl.RGBA, 		this.W, this.H, 0, 	_gl.RGBA, 	_gl.FLOAT, 	arrt);
                    }
                } else if(this.type == 'FLOAT') {
                    var arrayTemp = new Float32Array(this.W*this.H*4);

                    for(var n = 0, f = this.W*this.H; n < f; n++) {
                        var idd = n*4;
                        arrayTemp[idd] = arr[n];
                        arrayTemp[idd+1] = 0.0;
                        arrayTemp[idd+2] = 0.0;
                        arrayTemp[idd+3] = 0.0;
                    }
                    arr = arrayTemp;
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W, this.H, 0, _gl.RGBA, _gl.FLOAT, arr);
                }
            }
        }
        if(this.linear) _gl.generateMipmap(_gl.TEXTURE_2D);
    };

    /**
     * Write WebGL buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @type Void
     */
    this.writeWebGLBuffer = function(arr, flip) {
        inData = arr;
        if(this.mode == "VERTEX_INDEX") { // "VERTEX_INDEX" ELEMENT_ARRAY_BUFFER
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), _gl.DYNAMIC_DRAW);
        } else { // "VERTEX" || "VERTEX_AND_FRAGMENT" ARRAY_BUFFER
            _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(arr), _gl.DYNAMIC_DRAW);
        }
    };

    /**
     * Remove this buffer
     * @type Void
     */
    this.remove = function() {
        _gl.deleteRenderbuffer(this.rBuffer);
        _gl.deleteFramebuffer(this.fBuffer);

        if(this.mode == "FRAGMENT" || this.mode == "VERTEX_FROM_KERNEL" || this.mode == "VERTEX_AND_FRAGMENT")
            _gl.deleteTexture(this.textureData);

        if(this.mode == "VERTEX" || this.mode == "VERTEX_INDEX" || this.mode == "VERTEX_FROM_KERNEL" || this.mode == "VERTEX_AND_FRAGMENT")
            _gl.deleteBuffer(this.vertexData0);
    };
};


