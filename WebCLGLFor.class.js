/**
 * gpufor
 * @class
 * @param {Object} vars
 * @param {String} idx
 * @param {String} code
 * @return {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement}
 */
var gpufor = function(args, idx, code) {
    var _webCLGL = new WebCLGL();
    var _clglWork = _webCLGL.createWork(0);



    var strArgs = "", sep="";
    for(var key in args)
        strArgs += sep+key, sep=",";

    var ksrc =   'void main('+strArgs+') {'+
        'vec2 '+idx+' = get_global_id();'+
        code.replace("return", "out_float = ")+
        '}';
    var kernel = _webCLGL.createKernel();
    kernel.setKernelSource(ksrc);
    _clglWork.addKernel(kernel, "result");



    var buffLength = 0;
    for(var key in args) {
        var argVal = args[key];

        _clglWork.setArg(key.split(" ")[1], argVal);

        if(buffLength == 0 &&
            (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
            buffLength = argVal.length;
    }

    _clglWork.setAllowKernelWriting("result");
    _clglWork.setArg("result", new Float32Array(buffLength));



    _clglWork.enqueueNDRangeKernel("result", _clglWork.buffers_TEMP["result"]);
    _webCLGL.copy(_clglWork.buffers_TEMP["result"], _clglWork.buffers["result"]);



    var gpuResult = _webCLGL.enqueueReadBuffer_Float(_clglWork.buffers["result"]);
    return gpuResult;
};

/**
 * gpuforG
 * @param {HTMLCanvasElement}
 * @param {Object} args
 * @param {Array}
 */
var gpuforG = function(canvas, args) {
    var utils = new WebCLGLUtils();
    var gl = utils.getWebGLContextFromCanvas(canvas);

    var _webCLGL = new WebCLGL(gl);
    var _clglWork = _webCLGL.createWork(1000);

    for(var i = 2; i < arguments.length-1; i++) { // kernels
        var K = arguments[i];
        var idx = K[0];
        var outArg = K[1];
        var ksrc = K[2];

        _clglWork.setAllowKernelWriting(outArg);


        var typ;
        var argsInThisKernel = {};
        var strArgs = "", sep="";
        for(var key in args) {
            var expl = key.split(" ");

            if(expl[1] == outArg) {
                typ = expl[0].match(new RegExp("float4", "gm"));
                typ = (typ != null && typ.length > 0) ? "out_float4 = " : "out_float = ";
            }

            var matches = ksrc.match(new RegExp(expl[1], "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisKernel[key] = true;
        }
        for(var key in argsInThisKernel)
            strArgs += sep+key, sep=",";


        ksrc = 'void main('+strArgs+') {'+
                    'vec2 '+idx+' = get_global_id();'+
                    ksrc.replace("return", typ)+
                '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);
        _clglWork.addKernel(kernel, outArg);
    }
    for(var i = arguments.length-1; i < arguments.length; i++) { // VFP
        var VFP = arguments[i];
        var VFP_vertexH = VFP[0];
        var VFP_vertexS = VFP[1];
        var VFP_fragmentH = VFP[2];
        var VFP_fragmentS = VFP[3];


        var argsInThisVFP_v = {};
        var strArgs_v = "", sep="";
        for(var key in args) {
            var matches = VFP_vertexS.match(new RegExp(key.split(" ")[1], "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisVFP_v[key] = true;
        }
        for(var key in argsInThisVFP_v)
            strArgs_v += sep+key, sep=",";

        var argsInThisVFP_f = {};
        var strArgs_f = "", sep="";
        for(var key in args) {
            matches = VFP_fragmentS.match(new RegExp(key.split(" ")[1], "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisVFP_f[key] = true;
        }
        for(var key in argsInThisVFP_f)
            strArgs_f += sep+key, sep=",";

        VFP_vertexS = 'void main('+strArgs_v+') {'+
                        VFP_vertexS+
                    '}';
        VFP_fragmentS = 'void main('+strArgs_f+') {'+
                        VFP_fragmentS+
                    '}';


        var vfprogram = _webCLGL.createVertexFragmentProgram();
        vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
        vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);
        _clglWork.addVertexFragmentProgram(vfprogram, "vertexFragmentProgram1");
    }

    for(var key in args) {
        var argVal = args[key];

        if(key == "indices")
            _clglWork.setIndices(argVal);
        else
            _clglWork.setArg(key.split(" ")[1], argVal);
    }

    return _webCLGL;
};

var gpuforG_processKernels = function(webCLGL) {
    var webCLGLWork = webCLGL.getWorks()[0];
    for(var key in webCLGLWork.kernels)
        webCLGLWork.enqueueNDRangeKernel(key, webCLGLWork.buffers_TEMP[key]);
};

var gpuforG_update = function(webCLGL, argName) {
    var webCLGLWork = webCLGL.getWorks()[0];
    webCLGL.copy(webCLGLWork.buffers_TEMP[argName], webCLGLWork.buffers[argName]);
};

var gpuforG_getCtx = function(webCLGL) {
    return webCLGL.getContext();
};

var gpuforG_setArg = function(webCLGL, argName, value) {
    var webCLGLWork = webCLGL.getWorks()[0];
    webCLGLWork.setArg(argName, value);
};

/**
 * gpuforG_processGraphic
 * @param {WebCLGL}
 * @param {String} [argument=undefined] Argument for vertices count or undefined if indices exist
 * @param {Int} [drawMode=0] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
 **/
var gpuforG_processGraphic = function(webCLGL, argument, drawMode) {
    var webCLGLWork = webCLGL.getWorks()[0];
    var dmode = (drawMode != undefined) ? drawMode : 0;

    webCLGLWork.enqueueVertexFragmentProgram(argument, "vertexFragmentProgram1", dmode);
};