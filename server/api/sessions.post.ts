import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

type Player = {
  name: string;
  budget: number;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Calculate players' balances after initial fee deduction
    const playersWithDeductedFee = body.players.map((player: Player) => ({
      ...player,
      budget: player.budget - body.initialFee,
      initialBudget: player.budget
    }))

    // Create initial transaction records
    const initialTransactions = body.players.map((player: Player) => ({
      playerName: player.name,
      amount: -body.initialFee,
      type: 'INITIAL_FEE',
      timestamp: new Date(),
      description: 'Initial game fee'
    }))
    
    const session = {
      ...body,
      players: playersWithDeductedFee,
      bankBalance: body.initialFee * body.players.length,
      transactions: initialTransactions,
      createdAt: new Date(),
      status: 'active',
      game: 'latlat'
    }
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    const result = await sessions.insertOne(session)
    
    return { 
      success: true, 
      sessionId: result.insertedId,
      session
    }
  } catch (error) {
    console.error('Failed to create session:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create session'
    })
  } finally {
    await client.close()
  }
}) 