const express = require('express')
var http = require('http');
var socketIO = require('socket.io');
const cors = require('cors')
const { addUser, removeUser, getUserById, getRoomUsers } = require('./users')

const port = process.env.PORT ||4000
const app = express()

app.use(cors());

const httpServer = http.createServer(app);
const io = socketIO(httpServer)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room })
    if (error) {
      callback(error)
    }

    socket.join(room) ;

    socket.emit('message',{// sending 
      user:'system', 
      text:`welcome ${name} to ${room}.`
    })

    socket.broadcast.to(room).emit('message',{// sending
      user:'system', 
      text:`${name} just joined ${room}.`
    })

    const roomUsers = getRoomUsers(room)
    io.to(room).emit('userList',{ roomUsers })// sending
    console.log(roomUsers);

    callback()
  })

//done
  
  socket.on('message', (message) => {  //listening 
    const user = getUserById(socket.id)

    // sending
    io.to(user.room).emit('message',{ 
      user: user.name,  
      text:message
    })
  }
  );

  socket.on('disconnect', () => { //listening 
    const user = removeUser(socket.id)

    if(user){
      io.to(user.room).emit('message',{// sending 
        user:'system', 
        text:`${user.name} just left ${user.room}.`
      })
      const roomUsers = getRoomUsers(user.room)
      io.to(user.room).emit('userList',{ roomUsers }) // sending
    }    
  });

});

httpServer.listen(port, () => {
  console.log(`Server is running on port : ${port}`)
})


//emit kore msz hisabe ja pathabo socket.on er vitor call back function er parameter hisabe oi koyta parameter pabo