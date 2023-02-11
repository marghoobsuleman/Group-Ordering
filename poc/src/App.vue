<template>
  <h1>Chat App</h1>
  <button @click="createGroup">Create group</button>
  <br/>
  <input v-model="groupID" type="text" placeholder="Group ID" />
  <button @click="joinGroup">Join group</button>
</template>

<script>
import socket from "./socket";
export default {
  data() {
    return {
      groupID: ""
    }
  },
  methods: {
    createGroup() {
      socket.connect();
    },
    joinGroup() {

    }
  }
}
</script>

<style scoped>
</style>
