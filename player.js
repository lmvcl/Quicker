var hls;
var debug;
var recoverDecodingErrorDate,recoverSwapAudioCodecDate;
var pendingTimedMetadata = [];

function handleMediaError(hls) {
  var now = performance.now();
  if(!recoverDecodingErrorDate || (now - recoverDecodingErrorDate) > 3000) {
    recoverDecodingErrorDate = performance.now();
    var msg = "trying to recover from media Error ..."
    console.warn(msg);
    hls.recoverMediaError();
  } else {
    if(!recoverSwapAudioCodecDate || (now - recoverSwapAudioCodecDate) > 3000) {
      recoverSwapAudioCodecDate = performance.now();
      var msg = "trying to swap Audio Codec and recover from media Error ..."
      console.warn(msg);
      hls.swapAudioCodec();
      hls.recoverMediaError();
    } else {
      var msg = "cannot recover, last media error recovery failed ..."
      console.error(msg);
    }
  }
}

function handleTimedMetadata(event, data) {
  for (var i = 0; i < data.samples.length; i++) {
    var pts = data.samples[i].pts;
    var str =  new TextDecoder('utf-8').decode(data.samples[i].data.subarray(22));
    pendingTimedMetadata.push({pts: pts, value: str});
  }
}

function timeUpdateCallback() {
  if (pendingTimedMetadata.length == 0 || pendingTimedMetadata[0].pts > video.currentTime) {
    return;
  }
  var e = pendingTimedMetadata[0];
  pendingTimedMetadata = pendingTimedMetadata.slice(1);
  console.log('Metadata ' + e.value + " at " + e.pts + "s");
}

function playM3u8(url){
  debug = false;
  native = false;
  var video = document.getElementById('video');
  if(native){
    video.classList.add("native_mode");
    video.classList.remove("zoomed_mode");
  } else {
    video.classList.remove("native_mode");
    video.classList.add("zoomed_mode");
  }
  if(hls){ hls.destroy(); }
  hls = new Hls({debug:debug});
  var m3u8Url = decodeURIComponent(url)
  hls.loadSource(m3u8Url);
  hls.attachMedia(video);
  video.ontimeupdate = timeUpdateCallback;
  hls.on(Hls.Events.MANIFEST_PARSED,function() {
    video.play();
  });
  hls.on(Hls.Events.FRAG_PARSING_METADATA, handleTimedMetadata);
  document.title = url
}
$(window).bind('hashchange', function() {
  playM3u8(window.location.href.split("#")[1]);
});
$(function () {
  playM3u8(window.location.href.split("#")[1]); 
});
