'use strict';

/*
 * INITIALIZATION
 */

var callButton = document.getElementById('callButton');
var setBandwidthButton = document.getElementById('setBandwidthButton');
var targetBandwidthInput = document.getElementById('targetBandwidth');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var calling = false;
var signalling = new Signalling({
  room: 'k8s',
  onMessage: onSignallingMessage, // <<----- KI KELL TÖLTENI
  signallingServer: 'https://signalling.medianets.hu:3000'
});

var pc = new RTCPeerConnection({
  iceServers: [{urls: 'stun:freestun.net:5350'}]
});

callButton.disabled = true;
setBandwidthButton.disabled = true;

callButton.onclick = call;
setBandwidthButton.onclick = setBandwidth;
pc.onicecandidate = onLocalICECandidateGenerated;
pc.oniceconnectionstatechange = onIceConnectionStateChange;

pc.ontrack = gotRemoteStream;

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    width: { min: 800 },
    height: { min: 600 }
  }
}).then(gotLocalStream)
  .catch(onError);

/*
 * CALLBACKS
 */

function call() {
  callButton.disabled = true;
  calling = true;

  pc.createOffer()
    .then(onCreateOfferSuccess)
    .catch(onError);
}

function setBandwidth() {
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  var sender = pc.getSenders()[0];
  var parameters = sender.getParameters();
  var targetBandwidth = parseInt(targetBandwidthInput.value);

  if (isFirefox && !parameters.encodings) {
    parameters.encodings = [{}];
  }
  
  parameters.encodings[0].maxBitrate = targetBandwidth*1000;
  sender.setParameters(parameters).then(() => {console.log("success setting max bitrate to " + targetBandwidth);})
}

function onSignallingMessage(msg) {
  switch(msg.type) {
    case 'offer':
      callButton.disabled = true;

      pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.data)))
        .then(onSetRemoteDescriptionSuccess)
        .catch(onError);
      break;

    case 'ice_candidate':
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: msg.sdpMLineIndex,
        sdpMid: msg.sdpMid,
        candidate: msg.candidate});

      pc.addIceCandidate(candidate)
        .then(onAddIceCandidateSuccess)
        .catch(onError);
      break;
  }
}

/*
 * STREAMS
 */

function gotLocalStream(stream) {
  localVideo.srcObject = stream;
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  callButton.disabled = false;
}

function gotRemoteStream(event) {
  remoteVideo.srcObject = event.streams[0];

  pc.getSenders().forEach(sender => {console.log(sender);})
  setBandwidthButton.disabled = false;
}

/*
 * DESCRIPTIONS
 */

function onSetLocalDescriptionSuccess() {}

function onSetRemoteDescriptionSuccess() {
  if(!calling) {
    pc.createAnswer()
      .then(onCreateAnswerSuccess)
      .catch(onError);
  }
}

/*
 * OFFER / ANSWER
 */

function onCreateOfferSuccess(offer) {
    pc.setLocalDescription(offer)
    .then(onSetLocalDescriptionSuccess)
    .catch(onError);

  signalling.send({
    type: 'offer',
    data: JSON.stringify(offer)
  });
}

function onCreateAnswerSuccess(answer) {
    pc.setLocalDescription(answer)
    .then(onSetLocalDescriptionSuccess)
    .catch(onError);

  signalling.send({
    type: 'offer',
    data: JSON.stringify(answer)
  });
}

/*
 * ICE
 */

function onLocalICECandidateGenerated(event) {
  if (event.candidate) {
        signalling.send({
      type: 'ice_candidate',
      sdpMLineIndex: event.candidate.sdpMLineIndex,
      sdpMid: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }
}

function onAddIceCandidateSuccess() {}

function onIceConnectionStateChange(event) {}

/*
 * ERROR HANDLING
 */

function onError(error) {
  console.log(error);
}
