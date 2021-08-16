/* Declares the LMusic Audio Worklet Processor */

class LMusic_AWP extends AudioWorkletGlobalScope.WAMProcessor
{
  constructor(options) {
    options = options || {}
    options.mod = AudioWorkletGlobalScope.WAM.LMusic;
    super(options);
  }
}

registerProcessor("LMusic", LMusic_AWP);
