<script setup lang="ts">

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'



interface Transaction {

  playerName: string

  amount: number

  type: string

  timestamp: Date

  description: string

}



interface Player {

  name: string

  budget: number

  initialBudget: number

}



interface GameSession {

  sessionCode: string

  initialFee: number

  players: Player[]

  bankBalance: number

  transactions: Transaction[]

  createdAt: Date

  status: string

}



interface PlayerBalanceUpdate {

  name: string

  additionalBalance: number

}



const route = useRoute()

const router = useRouter()

const sessionCode = route.params.code as string

const session = ref<GameSession | null>(null)

const showTransactions = ref(false)

const currentPlayerIndex = ref(0)

const showGameEndDialog = ref(false)

const showContinueDialog = ref(false)

const betAmount = ref(0)

const roundStartIndex = ref(0)

const newInitialFee = ref(0)

const playerBalanceUpdates = ref<PlayerBalanceUpdate[]>([])

const playersToRemove = ref<string[]>([])



// Fetch session data

async function fetchSession() {

  try {

    const response = await $fetch<{ session: GameSession }>(`/api/sessions/${sessionCode}`)

    session.value = response.session

    // Check if bank is empty

    if (session.value?.bankBalance === 0) {

      showGameEndDialog.value = true

    }

  } catch (error) {

    console.error('Failed to fetch session:', error)

  }

}



function nextPlayer() {

  if (!session.value) return

  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % session.value.players.length

  

  if (currentPlayerIndex.value === roundStartIndex.value) {

    roundStartIndex.value = (roundStartIndex.value + 1) % session.value.players.length

    currentPlayerIndex.value = roundStartIndex.value

  }

}



async function placeBet(won: boolean) {

  if (!session.value) return

  

  const currentPlayer = session.value.players[currentPlayerIndex.value]

  const amount = betAmount.value



  try {

    const response = await $fetch(`/api/sessions/${sessionCode}/bet`, {

      method: 'POST',

      body: {

        playerName: currentPlayer.name,

        amount: won ? amount : -amount,

        bankChange: won ? -amount : amount

      }

    })

    

    if (response.success) {

      await fetchSession()

      betAmount.value = 0

      nextPlayer()

    }

  } catch (error) {

    console.error('Failed to process bet:', error)

    alert('Failed to process bet')

  }

}



function skipBet() {

  betAmount.value = 0

  nextPlayer()

}



async function endGame() {

  try {

    await $fetch(`/api/sessions/${sessionCode}/end`, {

      method: 'POST'

    })

    router.push('/')

  } catch (error) {

    console.error('Failed to end game:', error)

  }

}



async function continueGame() {

  if (!session.value) return

  

  showGameEndDialog.value = false

  newInitialFee.value = session.value.initialFee

  

  // Initialize balance updates for each player

  playerBalanceUpdates.value = session.value.players.map(player => ({

    name: player.name,

    additionalBalance: 0

  }))

  

  showContinueDialog.value = true

}



async function updateGameSettings() {

  if (!session.value) return

  

  try {

    // Update players with their new balances

    const updatedPlayers = session.value.players.map(player => {

      const balanceUpdate = playerBalanceUpdates.value.find(p => p.name === player.name) || { additionalBalance: 0 }

      const totalBalance = player.budget + balanceUpdate.additionalBalance

      

      return {

        ...player,

        budget: totalBalance,

        initialBudget: totalBalance

      }

    }).filter(player => player.budget >= (newInitialFee.value + 20))

    

    if (updatedPlayers.length < 2) {

      alert('At least 2 players with sufficient balance are required to continue')

      return

    }

    

    const response = await $fetch(`/api/sessions/${sessionCode}/continue`, {

      method: 'POST',

      body: {

        initialFee: newInitialFee.value,

        players: updatedPlayers,

        bankBalance: newInitialFee.value * updatedPlayers.length

      }

    })

    

    if (response.success) {

      showContinueDialog.value = false

      await fetchSession()

      currentPlayerIndex.value = 0

      roundStartIndex.value = 0

    }

  } catch (error) {

    console.error('Failed to update game settings:', error)

    alert('Failed to update game settings')

  }

}



onMounted(() => {

  fetchSession()

  currentPlayerIndex.value = roundStartIndex.value

})

</script>



<template>

  <div class="container mx-auto p-4 min-h-screen">

    <div v-if="session" class="space-y-6">

      <!-- Header Section -->

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        <!-- Session Info -->

        <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">

          <h1 class="text-xl sm:text-2xl font-bold mb-2">Latlat Game Session: {{ sessionCode }}</h1>

          <div class="text-sm text-gray-500">

            Started: {{ new Date(session.createdAt).toLocaleString() }}

          </div>

        </div>



        <!-- Bank Info -->

        <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">

          <div class="space-y-2">

            <h2 class="text-lg sm:text-xl font-semibold">Bank Information</h2>

            <div class="grid grid-cols-2 gap-3">

              <div class="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-md">

                <div class="text-xs sm:text-sm text-gray-500">Initial Fee</div>

                <div class="text-base sm:text-lg font-semibold">${{ session.initialFee }}</div>

              </div>

              <div class="p-2 sm:p-3 bg-green-50 dark:bg-green-900 rounded-md">

                <div class="text-xs sm:text-sm text-gray-500">Bank Balance</div>

                <div class="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">

                  ${{ session.bankBalance }}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>



      <!-- Round Information -->

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">

        <div class="flex flex-col sm:flex-row justify-between items-center">

          <div class="flex items-center gap-4">

            <div class="text-sm">

              <span class="text-gray-500">Round Starter:</span>

              <span class="font-medium ml-2">{{ session.players[roundStartIndex].name }}</span>

            </div>

            <div class="text-sm">

              <span class="text-gray-500">Current Turn:</span>

              <span class="font-semibold ml-2 text-primary">{{ session.players[currentPlayerIndex].name }}</span>

            </div>

          </div>

          

          <!-- Betting Controls -->

          <div class="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">

            <Input 

              type="number" 

              v-model="betAmount"

              :max="session.players[currentPlayerIndex].budget"

              min="0"

              placeholder="Enter bet amount"

              class="w-32"

            />

            <Button 

              @click="() => placeBet(true)"

              :disabled="!betAmount || betAmount > (session.bankBalance || 0)"

              variant="default"

              size="sm"

            >

              Won Bet

            </Button>

            <Button 

              @click="() => placeBet(false)"

              :disabled="!betAmount || betAmount > session.players[currentPlayerIndex].budget"

              variant="destructive"

              size="sm"

            >

              Lost Bet

            </Button>

            <Button 

              @click="skipBet" 

              variant="outline"

              size="sm"

            >

              Skip Turn

            </Button>

          </div>

        </div>

      </div>



      <!-- Players Grid - Always 3 columns -->

      <div class="grid grid-cols-3 gap-2 sm:gap-4 max-w-6xl mx-auto">

        <div v-for="(player, index) in session.players" 

             :key="player.name" 

             :class="[

               'bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',

               currentPlayerIndex === index ? 'ring-2 ring-primary' : ''

             ]">

          <!-- Player Number Badge -->

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3">

            <h3 class="text-sm sm:text-lg font-semibold truncate">{{ player.name }}</h3>

            <span class="text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 sm:px-2 sm:py-1 mt-1 sm:mt-0">

              P{{ index + 1 }}

            </span>

          </div>

          

          <!-- Player Stats -->

          <div class="space-y-1 sm:space-y-2">

            <!-- Initial Budget -->

            <div class="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-700 rounded-md">

              <div class="text-[10px] sm:text-xs text-gray-500">Initial</div>

              <div class="text-xs sm:text-sm font-medium">${{ player.initialBudget }}</div>

            </div>

            

            <!-- Current Balance -->

            <div class="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-700 rounded-md">

              <div class="text-[10px] sm:text-xs text-gray-500">Current</div>

              <div class="text-xs sm:text-sm font-medium" :class="{

                'text-green-600 dark:text-green-400': player.budget > 0,

                'text-red-600 dark:text-red-400': player.budget < 0

              }">

                ${{ player.budget }}

              </div>

            </div>



            <!-- Balance Change -->

            <div class="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-700 rounded-md">

              <div class="text-[10px] sm:text-xs text-gray-500">Change</div>

              <div class="text-xs sm:text-sm font-medium" :class="{

                'text-green-600 dark:text-green-400': player.budget > player.initialBudget,

                'text-red-600 dark:text-red-400': player.budget < player.initialBudget,

                'text-gray-600 dark:text-gray-400': player.budget === player.initialBudget

              }">

                {{ player.budget - player.initialBudget >= 0 ? '+' : '' }}

                ${{ player.budget - player.initialBudget }}

              </div>

            </div>

          </div>

        </div>

      </div>



      <!-- Transaction History -->

      <div v-if="showTransactions" 

           class="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">

        <h2 class="text-lg sm:text-xl font-semibold mb-4">Transaction History</h2>

        <div class="space-y-2">

          <div v-for="(transaction, index) in session.transactions" 

               :key="index"

               class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">

            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">

              <div>

                <span class="font-medium">{{ transaction.playerName }}</span>

                <span class="block sm:inline text-gray-600 dark:text-gray-400 text-sm sm:ml-2">

                  {{ transaction.description }}

                </span>

              </div>

              <span :class="{

                'text-red-600 dark:text-red-400': transaction.amount < 0,

                'text-green-600 dark:text-green-400': transaction.amount > 0

              }">

                {{ transaction.amount > 0 ? '+' : '' }}${{ transaction.amount }}

              </span>

            </div>

            <div class="text-xs text-gray-500 mt-1">

              {{ new Date(transaction.timestamp).toLocaleString() }}

            </div>

          </div>

        </div>

      </div>

    </div>

    <div v-else class="flex justify-center items-center h-[50vh]">

      <div class="animate-pulse text-gray-500">Loading session...</div>

    </div>



    <!-- Game End Dialog -->

    <Dialog v-model:open="showGameEndDialog">

      <DialogContent>

        <DialogHeader>

          <DialogTitle>Bank is Empty!</DialogTitle>

          <DialogDescription>

            Would you like to continue playing or end the game?

          </DialogDescription>

        </DialogHeader>



        <DialogFooter class="flex gap-2">

          <Button @click="endGame" variant="outline">

            End Game

          </Button>

          <Button @click="continueGame">

            Continue Playing

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>



    <!-- Continue Game Dialog -->

    <Dialog v-model:open="showContinueDialog">

      <DialogContent>

        <DialogHeader>

          <DialogTitle>Continue Game</DialogTitle>

          <DialogDescription>

            Set new initial fee and update player balances if needed

          </DialogDescription>

        </DialogHeader>



        <div class="space-y-4">

          <!-- Initial Fee Input -->

          <div class="space-y-2">

            <label class="text-sm font-medium">New Initial Fee</label>

            <Input 

              type="number"

              v-model="newInitialFee"

              min="0"

              placeholder="Enter new initial fee"

            />

          </div>



          <!-- Players List -->

          <div class="space-y-3">

            <h3 class="text-sm font-medium">Players</h3>

            <div v-for="player in session?.players" 

                 :key="player.name" 

                 class="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">

              <div class="flex justify-between items-center">

                <span class="font-medium">{{ player.name }}</span>

                <span :class="{

                  'text-green-600': player.budget >= (newInitialFee + 20),

                  'text-red-600': player.budget < (newInitialFee + 20)

                }">

                  Current: ${{ player.budget }}

                </span>

              </div>



              <!-- Show balance update input if player needs more money -->

              <div v-if="player.budget < (newInitialFee + 20)" class="space-y-1">

                <div class="text-xs text-red-500">

                  Needs ${{ (newInitialFee + 20) - player.budget }} more to continue

                </div>

                <div class="flex gap-2">

                  <Input

                    type="number"

                    :model-value="playerBalanceUpdates.find(p => p.name === player.name)?.additionalBalance"

                    @update:model-value="(value: number) => {

                      const index = playerBalanceUpdates.findIndex(p => p.name === player.name)

                      if (index !== -1) {

                        playerBalanceUpdates[index].additionalBalance = value

                      }

                    }"

                    placeholder="Add balance"

                    min="0"

                    class="w-full"

                  />

                </div>

              </div>



              <!-- Show total balance after update -->

              <div v-if="(playerBalanceUpdates.find(p => p.name === player.name)?.additionalBalance ?? 0) > 0"

                   class="text-xs text-green-600">

                New Balance: ${{ player.budget + (playerBalanceUpdates.find(p => p.name === player.name)?.additionalBalance ?? 0) }}

              </div>

            </div>

          </div>

        </div>



        <DialogFooter class="flex gap-2">

          <Button 

            @click="updateGameSettings"

            :disabled="(session?.players.filter(player => {

              const balanceUpdate = playerBalanceUpdates.find(p => p.name === player.name)

              const totalBalance = player.budget + (balanceUpdate?.additionalBalance ?? 0)

              return totalBalance >= (newInitialFee + 20)

            }).length ?? 0) < 2"

          >

            Continue Game

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  </div>

</template>



<style scoped>

.container {

  max-width: 1200px; /* Reduced from 1400px for better readability */

}

</style> 
