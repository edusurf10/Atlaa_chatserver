/* eslint-disable no-console */
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const expectadores = {};

const jogadores = {};

const refreshExpectadores = () => {
  io.emit('Lista de expectadores', expectadores);
};

const refreshJogadores = () => {
  io.emit('Lista de jogadores', jogadores);
};

io.on('connection', (socket) => {
  socket.on('userInfo', (user) => {
    if (user.id) {
      const userInfo = user;
      expectadores[socket.id] = { userInfo };
      console.log(` ${expectadores[socket.id].userInfo.username} => conectou-se...`);
      socket.on('Adicionar a sala', (roomID) => {
        socket.join([roomID, `${roomID}-geral`], () => {
          expectadores[socket.id].userInfo.roomID = roomID;
          refreshExpectadores();
          refreshJogadores();
        });
      });
      refreshExpectadores();
      refreshJogadores();
    } else {
      console.log('Sem dados do usuário conectado');
    }
  });

  socket.on('disconnect', () => {
    delete expectadores[socket.id];
    delete jogadores[socket.id];
    refreshExpectadores();
    refreshJogadores();
  });

  socket.on('Enviar mensagem para todos', (mensagem) => {
    try {
      if (Object.keys(jogadores).includes(socket.id)) {
        io.to(Object.keys(socket.rooms)[0])
          .emit('Mensagens recebidas', mensagem);
      } else {
        io.sockets.connected[socket.id].emit('Mensagens recebidas', { username: '[-SYSTEM-] => ', message: 'Para mandar msg no chat você precisa ser um JOGADOR' });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on('Enviar mensagem para todos geral', (mensagem) => {
    try {
      io.to(`${Object.keys(socket.rooms)[0]}-geral`)
        .emit('Mensagens recebidas geral', mensagem);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on('Rolar dados', (data) => {
    try {
      if (Object.keys(jogadores).includes(socket.id)) {
        const { dados } = data.message;
        const { lados } = data.message;
        const result = () => {
          let resultado = 0;
          for (let i = 0; i < dados; i += 1) {
            resultado += Math.floor(Math.random() * lados + 1);
          }
          return resultado;
        };
        io.to(Object.keys(socket.rooms)[0])
          .emit('Mensagens recebidas', { username: data.username, message: ` Rolou ${dados} dados com ${lados} lados e obteve ${result()}` });
      } else {
        io.sockets.connected[socket.id].emit('Mensagens recebidas', { username: '[-SYSTEM-] => ', message: 'Para rolar dados você precisa ser um JOGADOR' });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on('Remover expectador', (expectador) => {
    try {
      if (expectadores[expectador].userInfo) {
        const { userInfo } = expectadores[expectador];
        jogadores[expectador] = userInfo;
        delete expectadores[expectador];
        refreshExpectadores();
        refreshJogadores();
      }
    } catch (err) {
      console.log({ err });
    }
  });
});

// app.get('/', (req, res) => res.send('Hello World'));

const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Servidor rodando na porta -> ${port}!`));
