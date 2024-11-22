export interface Player {
  name: string
  budget: number
  initialBudget: number
}

export interface Transaction {
  playerName: string
  amount: number
  type: string
  timestamp: Date
  description: string
}

export interface GameSession {
  sessionCode: string
  initialFee: number
  players: Player[]
  bankBalance: number
  transactions: Transaction[]
  createdAt: Date
  status: 'active' | 'completed'
  game: 'latlat'
  endedAt?: Date
} 