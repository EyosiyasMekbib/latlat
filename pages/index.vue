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
import { useRouter } from 'vue-router'

interface Player {
  name: string
  budget: number
  initialBudget: number
}

interface Session {
  sessionCode: string
  initialFee: number
  players: Player[]
  bankBalance: number
  createdAt: Date
  status: string
}

const sessionCode = ref(generateSessionCode())
const initialFee = ref(0)
const players = ref<Player[]>([
  { name: '', budget: 0, initialBudget: 0 },
  { name: '', budget: 0, initialBudget: 0 }
])
const recentSessions = ref<Session[]>([])
const router = useRouter()

// Add loading state
const isCreatingSession = ref(false)

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
  players.value.push({ name: '', budget: 0, initialBudget: 0 })
}

function removePlayer(index: number) {
  if (players.value.length > 2) { // Maintain minimum 2 players
    players.value.splice(index, 1)
  }
}

async function handleSubmit() {
  try {
    isCreatingSession.value = true
    
    // Validate inputs
    if (initialFee.value <= 0) {
      alert('Please enter a valid initial fee')
      return
    }
    
    // Check if any player has insufficient funds (initial fee + 20 minimum)
    const insufficientPlayers = players.value.filter(p => 
      p.budget < (initialFee.value + 20)
    )
    
    if (insufficientPlayers.length > 0) {
      const playerNames = insufficientPlayers.map(p => p.name || 'Unnamed player').join(', ')
      alert(`The following players don't have enough budget (need initial fee + $20 minimum): ${playerNames}`)
      return
    }

    if (players.value.some(p => !p.name || p.budget <= 0)) {
      alert('Please fill in all player details')
      return
    }

    const response = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        sessionCode: sessionCode.value,
        initialFee: initialFee.value,
        players: players.value
      }
    })

    if (response.success) {
      await router.push(`/game/${sessionCode.value}`)
    }
  } catch (error) {
    console.error('Failed to create session:', error)
    alert('Failed to create session. Please try again.')
  } finally {
    isCreatingSession.value = false
  }
}

// Add real-time validation for player budgets
function validatePlayerBudget(player: Player, index: number) {
  if (player.budget > 0 && player.budget < (initialFee.value + 20)) {
    alert(`Warning: Player ${index + 1} needs at least $${initialFee.value + 20} (initial fee + $20) to join`)
  }
}

// Add function to get winner from session
function getSessionWinner(session: Session) {
  return session.players.reduce((winner, player) => {
    if (!winner || player.budget > winner.budget) {
      return player
    }
    return winner
  }, null as Player | null)
}

// Fetch recent sessions
async function fetchRecentSessions() {
  try {
    const response = await $fetch<{ sessions: Session[] }>('/api/sessions/recent')
    recentSessions.value = response.sessions
  } catch (error) {
    console.error('Failed to fetch recent sessions:', error)
  }
}

onMounted(() => {
  fetchRecentSessions()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <!-- Create New Session Dialog -->
    <Dialog>
      <div class="flex-col text-center">
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
            <DialogTitle>Create Latlat Game Session</DialogTitle>
          </div>
          <DialogDescription>
            Your Latlat session code is: <span class="font-mono font-bold">{{ sessionCode }}</span>
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
                  @blur="validatePlayerBudget(player, index)"
                  :class="{
                    'border-red-500': player.budget > 0 && player.budget < (initialFee + 20)
                  }"
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
              <div v-if="player.budget > 0 && player.budget < (initialFee + 20)" 
                   class="text-xs text-red-500">
                Minimum budget required: ${{ initialFee + 20 }} (initial fee + $20)
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            @click="handleSubmit"
            :disabled="isCreatingSession"
          >
            <div v-if="isCreatingSession" 
                 class="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full">
            </div>
            {{ isCreatingSession ? 'Creating...' : 'Create Session' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Recent Sessions at bottom -->
    <div v-if="recentSessions.length > 0" class="w-full max-w-md mt-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Recent Games</h2>
        <span class="text-sm text-gray-500">Last 2 games</span>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div v-for="session in recentSessions" 
             :key="session.sessionCode"
             class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <!-- Session Code -->
          <div class="flex justify-between items-start mb-2">
            <div class="font-mono text-sm font-bold">
              {{ session.sessionCode }}
            </div>
            <span :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100': session.status === 'active',
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100': session.status === 'completed'
            }" class="px-2 py-0.5 rounded-full text-xs">
              {{ session.status }}
            </span>
          </div>

          <!-- Winner Info (if game is completed) -->
          <div v-if="session.status === 'completed' && getSessionWinner(session)" 
               class="mt-2 p-2 bg-green-50 dark:bg-green-900 rounded-md">
            <div class="text-xs text-gray-600 dark:text-gray-300">Winner</div>
            <div class="font-medium text-green-700 dark:text-green-300">
              {{ getSessionWinner(session)?.name }}
              <span class="text-sm">${{ getSessionWinner(session)?.budget }}</span>
            </div>
          </div>

          <!-- Game Stats -->
          <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div class="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-gray-500">Players</span>
              <div>{{ session.players.length }}</div>
            </div>
            <div class="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-gray-500">Bank</span>
              <div>${{ session.bankBalance }}</div>
            </div>
          </div>

          <!-- Join Button -->
          <Button 
            v-if="session.status === 'active'"
            variant="outline" 
            size="sm"
            class="w-full mt-3"
            @click="router.push(`/game/${session.sessionCode}`)"
          >
            Join Game
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}
</style>