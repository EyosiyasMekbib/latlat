import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

// Define a type for the player
type Player = {
  name: string;
  budget: number;
  // Add other properties as needed
}

export default defineEventHandler(async (event) => {
  try {
    const sessionCode = event.context.params?.code
    const body = await readBody(event)
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    // Deduct initial fee from players and create transactions
    const playersWithDeductedFee = body.players.map((player: Player) => ({
      ...player,
      budget: player.budget - body.initialFee
    }))

    const initialTransactions = body.players.map((player: Player) => ({
      playerName: player.name,
      amount: -body.initialFee,
      type: 'INITIAL_FEE',
      timestamp: new Date(),
      description: 'New round initial fee'
    }))
    
    const result = await sessions.updateOne(
      { sessionCode, game: 'latlat' },
      {
        $set: {
          players: playersWithDeductedFee,
          initialFee: body.initialFee,
          bankBalance: body.bankBalance
        },
        $push: {
          transactions: { $each: initialTransactions }
        }
      }
    )
    
    if (!result.matchedCount) {
      throw createError({
        statusCode: 404,
        message: 'Session not found'
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to continue game:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to continue game'
    })
  } finally {
    await client.close()
  }
}) 