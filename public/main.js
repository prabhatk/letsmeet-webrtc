const socket = io('/')
var isCameraEnabled = true
const streamConstrains = {
    audio: true,
    video: {
        "width": {
            "min": "120",
            "max": "240"
        },
        "height": {
            "min": "80",
            "max": "160"
        }
    }
}
const streamConstrainsOnlyAudio = {
    audio: true
}

let icsServers
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
}

let localStream
let rtcPeerConnections = {}
let streams = {}

socket.emit('launched', ROOM_ID)

socket.on('servers', servers => {
    iceServers = servers
    console.log(icsServers)
})
let muteElement = document.getElementById('mutebutton')
let callElement = document.getElementById('callbutton')
let cameraElement = document.getElementById('camerabutton')

muteElement.addEventListener('click', muteunmute)
callElement.addEventListener('click', disconnectcall)
cameraElement.addEventListener('click', videoenabledisable)

socket.on('room-created', async roomId => {
    console.log('[WHO AM I] : ', socket.id)
    console.log('[ROOM-CREATED] : ', roomId)
    await navigator.mediaDevices.getUserMedia(streamConstrains).then(stream => {
        localStream = stream
        streams[socket.id] = localStream
        addVideoElement(socket.id, streams[socket.id], true)
        setActiveVideo(streams[socket.id])
    }).catch(err => {
        console.log('[ROOM-CREATED] : An error occured while fetching user media devices.', err)
    })
})

socket.on('joined', async roomId => {
    console.log('[WHO AM I] : ', socket.id)
    console.log('[JOINED] ', roomId)
    await navigator.mediaDevices.getUserMedia(streamConstrains).then(stream => {
        localStream = stream
        streams[socket.id] = localStream
        addVideoElement(socket.id, streams[socket.id], true)
        setActiveVideo(streams[socket.id])
        socket.emit('ready', { roomId, userId: socket.id })
    }).catch(err => {
        console.log('[JOINED] : An error occured while fetching user media devices.')
    })
})

socket.on('ready', async event => {
    console.log('[READY] ', event.roomId)
    if (rtcPeerConnections[event.userId] == undefined) {
        console.log(iceServers)
        let rtcPeerConnection = createPeerConnection(iceServers, localStream, event.userId)
        await rtcPeerConnection.createOffer(offerOptions).then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('offer', {
                type: 'offer',
                sdp: sessionDescription,
                roomId: ROOM_ID,
                userId: socket.id,
                target: event.userId

            })
        }).catch(err => {
            console.log(err)
        })
    }
})

socket.on('offer', async event => {
    console.log('[OFFER] : from', event.userId, 'to', socket)
    if (rtcPeerConnections[event.userId] == undefined) {
        let rtcPeerConnection = createPeerConnection(iceServers, localStream, event.userId)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event.sdp))
        await rtcPeerConnection.createAnswer().then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('answer', {
                type: 'answer',
                sdp: sessionDescription,
                roomId: ROOM_ID,
                userId: socket.id,
                target: event.userId
            })
        }).catch(err => {
            console.log('[OFFER] : ', err)
        })
    }
})

socket.on('answer', event => {
    console.log('[ANSWER] : from ', event.userId, 'to', socket.id)
    let rtcPeerConnection = rtcPeerConnections[event.userId]
    rtcPeerConnection?.setRemoteDescription(new RTCSessionDescription(event.sdp))
})

function createPeerConnection(servers, stream, userId) {
    if (rtcPeerConnections[userId]) {
        console.log('[PEERCONNECTION] : ALREADY-EXIST :', userId)
        return rtcPeerConnections[userId]
    } else {
        let rtcPeerConnection = new RTCPeerConnection(servers)
        rtcPeerConnection.ontrack = function onAddStream(event) {
            console.log('[REMOTE STREAM] : ', userId, event.streams[0])
            streams[userId] = event.streams[0]
            addVideoElement(userId, streams[userId], userId === socket.id)
        }
        rtcPeerConnection.onicecandidate = async function onIceCandidate(event) {
            if (event.candidate) {
                console.log('[SENDING-ICE-CANDIDATE] : ')
                socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate,
                    roomId: ROOM_ID,
                    userId: socket.id,
                    target: userId
                })
            }
        }
        stream.getTracks().forEach(track => {
            console.log('[GET TRACKS]:', userId, track)
            rtcPeerConnection.addTrack(track, stream)
        });
        rtcPeerConnections[userId] = rtcPeerConnection
        return rtcPeerConnection
    }
}


socket.on('candidate', event => {
    console.log('[CANDIDATE | R] : ', event.userId)
    const candidate = new RTCIceCandidate(event.candidate)
    rtcPeerConnections[event.userId]?.addIceCandidate(candidate)
})

socket.on('user-left', userId => {
    console.log('[USER-LEFT] : ', userId)
    removeVideoElement(userId)
})

function muteunmute() {
    let audioTrack = localStream.getAudioTracks()[0]
    let muteStatus = audioTrack.enabled
    audioTrack.enabled = !muteStatus
    serMicButtonUI(audioTrack.enabled)
    console.log('mute status', muteStatus)
}
function disconnectcall() {
    console.log('stopping calls')
    stopAllVideos(streams)
    stopAllConnections(rtcPeerConnections)
    window.location.replace('/logout')

}
async function videoenabledisable() {
    let videoTrack = localStream.getVideoTracks()[0]
    let audioTrack = localStream.getAudioTracks()[0]
    console.log(videoTrack?.enabled, audioTrack?.enabled)
    if (isCameraEnabled) {
        videoTrack.stop()
        await navigator.mediaDevices.getUserMedia(streamConstrainsOnlyAudio).then(stream => {
            localStream = stream
            let newAudioTrack = localStream.getAudioTracks()[0]
            newAudioTrack.enabled = audioTrack?.enabled
            replaceWithNewStream(rtcPeerConnections, stream)
        })
    } else {
        await navigator.mediaDevices.getUserMedia(streamConstrains).then(stream => {
            localStream = stream
            let newAudioTrack = localStream.getAudioTracks()[0]
            newAudioTrack.enabled = audioTrack?.enabled
            let newVideoTrack = localStream.getVideoTracks()[0]
            newVideoTrack.enabled = true//videoTrack?.enabled
            replaceWithNewStream(rtcPeerConnections, stream)
            addVideoElement(socket.id, localStream, true)
            setCameraButtonUI(videoTrack?.enabled)
        })
    }
    isCameraEnabled = !isCameraEnabled
    videoTrack = localStream.getVideoTracks()[0]
    setCameraButtonUI(videoTrack?.enabled)
}