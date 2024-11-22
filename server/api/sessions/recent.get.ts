import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async () => {
  try {
    await client.connect()
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    const recentSessions = await sessions
      .find({ game: 'latlat' })
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray()
    
    return { 
      success: true, 
      sessions: recentSessions
    }
  } catch (error) {
    console.error('Failed to fetch recent sessions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch recent sessions'
    })
  } finally {
    await client.close()
  }
}) 