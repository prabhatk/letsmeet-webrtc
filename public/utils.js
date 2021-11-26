
function setActiveStreamFor() {
    console.log('video id',this.id)
    let toBeActiveVideoElement = document.getElementById(this.id)
    if(toBeActiveVideoElement) {
        const activeVideoElement = document.getElementById('activevideo')
        activeVideoElement.srcObject = null
        activeVideoElement.srcObject = toBeActiveVideoElement.srcObject
        activeVideoElement.volume = 0 
        activeVideoElement.muted = true
    }
}
function addVideoElement(userId, stream, iscaller) {
    const videoElement = getVideoElement(userId, iscaller)
    videoElement.srcObject = stream
    console.log('video Element', videoElement)
    const videoContainer = document.getElementById('videolist')
    videoContainer.appendChild(videoElement)
    console.log('video Container', videoContainer)
    videoElement.addEventListener('click', setActiveStreamFor)
}
function setActiveVideo(stream) {    
    const videoElement = document.getElementById('activevideo')
    videoElement.srcObject = stream
    videoElement.volume = 0 
    videoElement.muted = true
}

function removeVideoElement(userId) {
    const videoElement = getVideoElement(userId)
    if(videoElement) {
        videoElement.srcObject = null
        const videoContainer = document.getElementById('videolist')
        videoContainer.removeChild(videoElement)
    }
}

function getVideoElement(userId, iscaller) {
    let videoElement = document.getElementById(userId)
    if(videoElement) {
        console.log('[VIDEO ELEMENT] : ALREADY EXIST')
    }
    else {
        console.log('[VIDEO ELEMENT] : CREATED')
        videoElement = document.createElement('video')
        videoElement.setAttribute('id', userId)
        videoElement.setAttribute('class', "usersvideo")
        videoElement.setAttribute('playsinline', '')
        videoElement.playsInline = true
        videoElement.muted = 0
        videoElement.autoplay = true
    }
    if (iscaller) {
        videoElement.volume = 0
    }
    return videoElement
}

function log(...args) {
    console.log(...args)
}
function stopAllVideos(streams) {
    for (var key in streams) {
        let stream = streams[key]
        stream.getTracks().forEach(track => track.stop());
    }
}

function stopAllConnections(connections) {
    for (var key in connections) {
        let connection = connections[key]
        connection.close()
    }
}

function replaceWithNewStream(connections, stream) {
    for (var key in connections) {
        let connection = connections[key]
        connection.getSenders().forEach(sender => {
            console.log('sender',sender, 'type of stream', stream)
            sender.replaceTrack(stream.getVideoTracks()[0])
        });
    }
}