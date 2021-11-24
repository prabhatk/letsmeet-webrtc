const express = require('express')
const { Socket } = require('socket.io')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4 :  uuidv4} = require('uuid')
const MAX_USERS = 10
const port = process.env.PORT || 3000

const iceServers = {
    'iceServer' : [
        {'urls' : 'stun:stun.l.google.com:19302'},
        {'urls' : 'stun:stun2.l.google.com:19302'},
        {'urls' : 'stun:stun3.l.google.com:19302'},
        {'urls' : 'stun:stun4.l.google.com:19302'},
        {'urls' : 'stun:stun.services.mozilla.com'}
    ]
    // 'iceServer':[{'username':'1637779197:prj_7D9nqkYM0mZBfBosUe8jaQ',
    // 'credential':'TRwppwmoTp3tdTQjJ3ff5XZyk70=',
    // 'url':'turn:globalturn.subspace.com:3478?transport=udp',
    // 'urls':'turn:globalturn.subspace.com:3478?transport=udp'},
    // {'username':'1637779197:prj_7D9nqkYM0mZBfBosUe8jaQ',
    // 'credential':'TRwppwmoTp3tdTQjJ3ff5XZyk70=',
    // 'url':'turn:globalturn.subspace.com:3478?transport=tcp',
    // 'urls':'turn:globalturn.subspace.com:3478?transport=tcp'},
    // {'username':'1637779197:prj_7D9nqkYM0mZBfBosUe8jaQ',
    // 'credential':'TRwppwmoTp3tdTQjJ3ff5XZyk70=',
    // 'url':'turns:globalturn.subspace.com:5349?transport=udp',
    // 'urls':'turns:globalturn.subspace.com:5349?transport=udp'},
    // {'username':'1637779197:prj_7D9nqkYM0mZBfBosUe8jaQ',
    // 'credential':'TRwppwmoTp3tdTQjJ3ff5XZyk70=',
    // 'url':'turns:globalturn.subspace.com:5349?transport=tcp',
    // 'urls':'turns:globalturn.subspace.com:5349?transport=tcp'},
    // {'username':'1637779197:prj_7D9nqkYM0mZBfBosUe8jaQ',
    // 'credential':'TRwppwmoTp3tdTQjJ3ff5XZyk70=',
    // 'url':'turns:globalturn.subspace.com:443?transport=tcp',
    // 'urls':'turns:globalturn.subspace.com:443?transport=tcp'}]
}

var rooms = {}
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('entry', {roomId : uuidv4()})
})

app.get('/logout', (req, res) => {
    res.render('logout')
})

app.get('/room', (req, res) => {
    res.render('newroom', {roomId: req.query.roomId, nameId: req.query.nameId})
})
// app.post('/:room', (req, res) => {
//     console.log(req.params)
//     // res.render('newroom', {roomId: req.params.room})
//     res.render('newroom', {roomId: req.params.room, nameId: req.params.nameId})
// })


server.listen(port, () => {
    console.log('server is listning on port', port)
})

io.on('connection', socket => {
    console.log('new User with userId', socket.id)
    socket.on('launched', roomId => {
        console.log('[SERVER] : launched', roomId)
        const myRoom = rooms[roomId] || []
        const numbClients = myRoom.length
        console.log(myRoom, ' has ', numbClients, ' clients')
        socket.emit('servers',iceServers)
        if(numbClients == 0) {
            rooms[roomId] = [socket.id]
            socket.join(roomId)
            socket.roomId = roomId
            socket.emit('room-created', roomId)
        } else  if (numbClients < MAX_USERS){
            rooms[roomId].push(socket.id)
            socket.join(roomId)
            socket.roomId = roomId
            socket.emit('joined', roomId)
        } else {
            socket.emit('full',roomId)
            console.log('socket rooms', io.sockets.adapter.rooms.get(roomId))
        }

    }) 

    socket.on('ready', event => {
        console.log('[SERVER] : ready')
        socket.to(event.roomId).emit('ready', event)
    })
    socket.on('candidate', event => {
        console.log('[SERVER] : candidate')
        socket.to(event.target).emit('candidate', event)
    })
    socket.on('offer', event => {
        console.log('[SERVER] : offer')
        socket.to(event.target).emit('offer', event)
    })
    socket.on('answer', event => {
        console.log('[SERVER] : answer')
        socket.to(event.target).emit('answer', event)
    })

    socket.on('disconnect', () => {
        if(rooms[socket.roomId] !== undefined) {
            const index = rooms[socket.roomId].indexOf(socket.id)
            if(index !== undefined) {
                rooms[socket.roomId].splice(index,1)
                socket.to(socket.roomId).emit('user-left', socket.id)
                console.log('Auser left with id ', socket.id)
            }
        }
        if(rooms[socket.roomId]?.length == 0) {
            delete rooms[socket.roomId]
            console.log('As no user room is deleted')
        }
    })
})
