function joinButtonClicked() {
    console.log('joinButtonClicked')
    var roomId = document.getElementById('roomId')
    window.location.replace(`/${roomId.value}`)
}
