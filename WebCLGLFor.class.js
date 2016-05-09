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