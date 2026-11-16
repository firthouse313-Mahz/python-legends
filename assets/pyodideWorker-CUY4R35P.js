(function(){let e=null;async function t(){return e||=(async()=>{let e=`/python-legends/`;importScripts(`${e}pyodide/pyodide.js`);let t=self.loadPyodide;return await t({indexURL:`${e}pyodide/`})})(),e}self.onmessage=async e=>{let n=e.data;if(n.kind===`init`)try{await t(),self.postMessage({kind:`ready`})}catch(e){self.postMessage({kind:`init-error`,message:String(e?.message??e)})}else if(n.kind===`run`){let e=``,r=``;try{let i=await t();i.setStdout({batched:t=>e+=t+`
`}),i.setStderr({batched:e=>r+=e+`
`});let a=n.providedInputs??[];i.globals.set(`__dc_inputs`,a),await i.runPythonAsync(`import builtins
__dc_input_iter = iter(__dc_inputs)
def __dc_input(prompt=""):
    try:
        return next(__dc_input_iter)
    except StopIteration:
        raise EOFError("No more input available for input() in this mission")
builtins.input = __dc_input
`),await i.runPythonAsync(n.code),self.postMessage({kind:`result`,id:n.id,stdout:e,stderr:r,ok:!0})}catch(t){let i=t?.message?String(t.message):String(t);self.postMessage({kind:`result`,id:n.id,stdout:e,stderr:r,ok:!1,error:i})}}}})();