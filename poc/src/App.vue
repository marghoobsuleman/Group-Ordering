<template>
  <h1>Chat App</h1>
  <template v-if="!joinedGroup">
    <button @click="createGroup">Create group</button>
    <br/>
    <input v-model="groupID" type="text" placeholder="Group ID" />
    <button @click="joinGroup">Join group</button>
  </template>
  <template v-else>
    <h1>Welcome to the group {{ groupID }}</h1>
    <code v-for="itext in texts"> {{ itext }} <br/></code>
    <textarea v-model="text"></textarea> <br/>
    <button @click="sendToGroup">Send to group</button>
  </template>
</template>

<script>
import socket from "./socket";
export default {
  data() {
    return {
      groupID: "",
      joinedGroup: false,
      text: "",
      texts: []
    }
  },
  methods: {
    createGroup() {
      socket.emit("create group");
    },
    joinGroup() {
      socket.emit("join group", {id: this.groupID});
    },
    sendToGroup() {
      if(this.text) {
        socket.emit("send to group", { text: this.text, groupID: this.groupID });
      }
    },
  },
  created() {
    socket.on("group created", ({id}) => {
      this.groupID = id;
      this.joinedGroup = true;
      console.log("groupid", id);
    })

    socket.on("group joined", () => {
      this.joinedGroup = true;
    })

    socket.on("group not exist", () => {
      console.log("group does not exisit");
    })

    socket.on("text", ({ text }) => {
      this.texts.push(text);
    })
  }
}
</script>

<style scoped>
</style>
