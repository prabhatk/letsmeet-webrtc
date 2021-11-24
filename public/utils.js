function addVideoElement(userId, stream) {
    const videoElement = getVideoElement(userId)
    videoElement.srcObject = stream
    console.log('video Element', videoElement)
    const videoContainer = document.getElementById('videolist')
    videoContainer.appendChild(videoElement)
    console.log('video Container', videoContainer)
}
function setActiveVideo(stream) {    
    const videoElement = document.getElementById('activevideo')
    videoElement.srcObject = stream
}

function removeVideoElement(userId) {
    const videoElement = getVideoElement(userId)
    if(videoElement) {
        videoElement.srcObject = null
        const videoContainer = document.getElementById('videolist')
        videoContainer.removeChild(videoElement)
    }
}

function getVideoElement(userId) {
    let videoElement = document.getElementById(userId)
    if(videoElement) {
        console.log('[VIDEO ELEMENT] : ALREADY EXIST')
    }
    else {
        console.log('[VIDEO ELEMENT] : CREATED')
        videoElement = document.createElement('video')
        videoElement.setAttribute('id', userId)
        videoElement.setAttribute('class', "usersvideo")
        videoElement.setAttribute('webkit-playsinline', 'webkit-playsinline');
        videoElement.muted = true
        videoElement.autoplay = true
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
