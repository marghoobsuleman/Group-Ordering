import {io} from "socket.io-client";

const serverURL = "http://localhost:3000/"

const socket = io(serverURL, {autoConnect: false});

export default socket;