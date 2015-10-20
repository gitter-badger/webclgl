@echo off
title JSDOC WEBCLGL

set jsdocdir=jsdoc 3
set sourcesDir=..\
set outputDir=APIdoc


cd /D %jsdocdir%
echo GENERATING API DOC
jsdoc -t templates/docstrap-master/template -c confWebCLGL.json -d ..\%outputDir% ..\%sourcesDir%\WebCLGLUtils.class.js ..\%sourcesDir%\WebCLGLBuffer.class.js ..\%sourcesDir%\WebCLGLBufferItem.class.js ..\%sourcesDir%\WebCLGLKernel.class.js ..\%sourcesDir%\WebCLGLKernelProgram.class.js ..\%sourcesDir%\WebCLGLVertexFragmentProgram.class.js ..\%sourcesDir%\WebCLGLWork.class.js ..\%sourcesDir%\WebCLGL.class.js


echo.
echo.
echo API DOC GENERATED
pause

chrome.exe %outputDir%\WebCLGL.html

