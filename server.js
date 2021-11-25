const express = require('express')
const { Socket } = require('socket.io')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4 :  uuidv4} = require('uuid')
const MAX_USERS = 10
const port = process.env.PORT || 3000

var iceServers = {
    iceServers: [
      {   
        urls: [ "stun:bn-turn1.xirsys.com" ]
      }, 
      {   
        username: "0kYXFmQL9xojOrUy4VFemlTnNPVFZpp7jfPjpB3AjxahuRe4QWrCs6Ll1vDc7TTjAAAAAGAG2whXZWJUdXRzUGx1cw==",   
        credential: "285ff060-5a58-11eb-b269-0242ac140004",   
        urls: [       
          "turn:bn-turn1.xirsys.com:80?transport=udp",       
          "turn:bn-turn1.xirsys.com:3478?transport=udp",       
          "turn:bn-turn1.xirsys.com:80?transport=tcp",       
          "turn:bn-turn1.xirsys.com:3478?transport=tcp",       
          "turns:bn-turn1.xirsys.com:443?transport=tcp",       
          "turns:bn-turn1.xirsys.com:5349?transport=tcp"   
         ]
       }
     ]
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

// const accountSid = 'AC077a643439348bf51d452adf37837538'//process.env.TWILIO_ACCOUNT_SID;
// const authToken = '4e21eaac6c00953830cf666cf6b50369'//process.env.TWILIO_AUTH_TOKEN;
// const client = require('twilio')(accountSid, authToken);
// client.tokens.create().then(token => {
//     console.log('twilio working')
//     iceServers.iceServers = token.iceServers    
//     console.log(iceServers)
// }).catch(e => {
//     console.log('twilio failed',e)
// });

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
