import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri!)

export default defineEventHandler(async () => {
  try {
    console.log('Checking MongoDB connection...')
    await client.connect()
    
    const database = client.db('latlat')
    const sessions = database.collection('games')
    
    // List all databases
    const dbs = await client.db().admin().listDatabases()
    console.log('Available databases:', dbs)
    
    // Count documents in the games collection
    const count = await sessions.countDocuments()
    console.log('Number of documents in games collection:', count)
    
    // Get a sample of documents
    const sample = await sessions.find().limit(1).toArray()
    console.log('Sample document:', sample)
    
    return {
      success: true,
      databases: dbs,
      documentCount: count,
      sampleDocument: sample
    }
  } catch (error) {
    console.error('Database check failed:', error)
    throw createError({
      statusCode: 500,
      message: `Database check failed: ${error.message}`
    })
  } finally {
    await client.close()
  }
}) 