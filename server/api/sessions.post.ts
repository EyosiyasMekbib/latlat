import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri!)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('Attempting to connect to MongoDB...')
    await client.connect()
    console.log('Connected to MongoDB successfully')
    
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    const session = {
      ...body,
      players: body.players.map(player => ({
        ...player,
        budget: player.budget - body.initialFee,
        initialBudget: player.budget
      })),
      bankBalance: body.initialFee * body.players.length,
      transactions: body.players.map(player => ({
        playerName: player.name,
        amount: -body.initialFee,
        type: 'INITIAL_FEE',
        timestamp: new Date(),
        description: 'Initial game fee'
      })),
      createdAt: new Date(),
      status: 'active',
      game: 'latlat'
    }
    
    console.log('Attempting to insert session:', session)
    const result = await sessions.insertOne(session)
    console.log('Session inserted successfully:', result.insertedId)
    
    return { 
      success: true, 
      sessionId: result.insertedId,
      session
    }
  } catch (error) {
    console.error('Failed to create session:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to create session: ${error.message}`
    })
  } finally {
    await client.close()
  }
}) 