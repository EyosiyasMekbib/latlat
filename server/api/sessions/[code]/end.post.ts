import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const sessionCode = event.context.params?.code
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    const result = await sessions.updateOne(
      { 
        sessionCode,
        game: 'latlat'
      },
      {
        $set: {
          status: 'completed',
          endedAt: new Date()
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
    console.error('Failed to end game:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to end game'
    })
  } finally {
    await client.close()
  }
}) 