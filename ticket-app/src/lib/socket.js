import { io } from 'socket.io-client';

let socket;

const resolveSocketUrl = (value, { hostname, port }) => {
  if (!hostname) return value;
  if (!value) {
    return `http://${hostname}:${port}`;
  }
  if (value.includes('localhost') && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return value.replace('localhost', hostname);
  }
  return value;
};

const hostname =
  typeof window !== 'undefined' && window.location ? window.location.hostname : '';

export const getSocket = () => {
  if (!socket) {
    socket = io(
      resolveSocketUrl(import.meta.env.VITE_SOCKET_URL, { hostname, port: 5000 }),
      {
        transports: ['polling'],
        upgrade: false,
      }
    );
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
