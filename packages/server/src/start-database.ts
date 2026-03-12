import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let memoryServer: MongoMemoryServer | null = null

export async function DBConnect() {
    try {
        let dbUrl = process.env.MONGO_URI

        if (process.env.NODE_ENV === 'test') {
            memoryServer = await MongoMemoryServer.create()
            dbUrl = memoryServer.getUri()
        }

        const conn = await mongoose.connect(dbUrl!)
        console.log(`MongoDB Connected (${process.env.NODE_ENV}): ${conn.connection.host}`)
    } catch (err: any) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
    }
}

export async function DBClose() {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    if (memoryServer) await memoryServer.stop()
}

export async function DBClear() {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
}
