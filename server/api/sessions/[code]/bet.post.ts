import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const sessionCode = event.context.params?.code
    const { playerName, amount, bankChange } = await readBody(event)
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    // Update player balance and bank balance
    const result = await sessions.updateOne(
      { 
        sessionCode,
        game: 'latlat',
        'players.name': playerName
      },
      {
        $inc: {
          'players.$.budget': amount,
          bankBalance: bankChange
        },
        $push: {
          transactions: {
            playerName,
            amount,
            type: amount > 0 ? 'WIN' : 'LOSS',
            timestamp: new Date(),
            description: amount > 0 ? 'Won bet' : 'Lost bet'
          }
        }
      }
    )
    
    if (!result.matchedCount) {
      throw createError({
        statusCode: 404,
        message: 'Session or player not found'
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to process bet:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process bet'
    })
  } finally {
    await client.close()
  }
}) 