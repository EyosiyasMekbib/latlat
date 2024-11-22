import { MongoClient } from 'mongodb'
import type { GameSession, Player, Transaction } from '~/types/mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri!)

export default defineEventHandler(async (event) => {
  try {
    const sessionCode = event.context.params?.code
    const body = await readBody<{
      initialFee: number
      players: Player[]
      bankBalance: number
    }>(event)
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection<GameSession>('games')
    
    const initialTransactions: Transaction[] = body.players.map(player => ({
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
          players: body.players.map(p => ({
            ...p,
            budget: p.budget - body.initialFee
          })),
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
    if (error instanceof Error) {
      console.error('Failed to continue game:', error)
      throw createError({
        statusCode: 500,
        message: `Failed to continue game: ${error.message}`
      })
    }
    throw error
  } finally {
    await client.close()
  }
}) 