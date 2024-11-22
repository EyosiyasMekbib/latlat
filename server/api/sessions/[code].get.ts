import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const sessionCode = event.context.params?.code
    
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    const session = await sessions.findOne({ 
      sessionCode,
      game: 'latlat'
    })
    
    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found'
      })
    }
    
    return { 
      success: true, 
      session 
    }
  } catch (error) {
    console.error('Failed to fetch session:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch session'
    })
  } finally {
    await client.close()
  }
}) 