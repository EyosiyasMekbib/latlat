<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { h } from 'vue'
import logo from '@/assets/SVG/logo.svg'

interface Player {
  name: string
  budget: number
}

const sessionCode = ref(generateSessionCode())
const initialFee = ref(0)
const players = ref<Player[]>([
  { name: '', budget: 0 },
  { name: '', budget: 0 }
])

function generateSessionCode() {
  // Generate a 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

function addPlayer() {
  players.value.push({ name: '', budget: 0 })
}

function removePlayer(index: number) {
  if (players.value.length > 2) { // Maintain minimum 2 players
    players.value.splice(index, 1)
  }
}

function handleSubmit() {
  // Handle the form submission logic here
  console.log({
    sessionCode: sessionCode.value,
    initialFee: initialFee.value,
    players: players.value
  })
}
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <Dialog>
      <div class="flex-col">
        <img :src="logo" alt="Logo" class="w-32 h-32 mb-8" />
        <DialogTrigger as-child>
          <Button variant="outline">
            <Icon name="lucide:plus" />
            Create Session
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <div class="flex items-center gap-2 mb-4">
            <DialogTitle>Create Game Session</DialogTitle>
          </div>
          <DialogDescription>
            Your session code is: <span class="font-mono font-bold">{{ sessionCode }}</span>
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <!-- Initial Fee -->
          <div class="form-group">
            <label for="initialFee" class="block text-sm font-medium">Initial Fee</label>
            <Input 
              type="number" 
              id="initialFee" 
              v-model="initialFee" 
              placeholder="Enter initial fee"
              min="0"
            />
          </div>

          <!-- Players Section -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium">Players</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                @click="addPlayer"
              >
                <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </div>

            <div v-for="(player, index) in players" :key="index" class="space-y-2">
              <div class="flex items-center gap-2">
                <Input 
                  type="text" 
                  v-model="player.name" 
                  :placeholder="`Player ${index + 1} name`"
                />
                <Input 
                  type="number" 
                  v-model="player.budget" 
                  :placeholder="'Budget'"
                  min="0"
                />
                <Button 
                  v-if="players.length > 2"
                  type="button" 
                  variant="outline" 
                  size="icon"
                  @click="() => removePlayer(index)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" @click="handleSubmit">
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>