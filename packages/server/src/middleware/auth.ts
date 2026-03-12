import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient, { JwksClient } from 'jwks-rsa'
import ApiError from '../errors/api-error.js'

let client: JwksClient | undefined

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    if (!client) {
        client = jwksClient({
            jwksUri: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/discovery/v2.0/keys`
        })
    }
    client.getSigningKey(header.kid!, (err, key) => {
        if (err) return callback(err)
        callback(null, key!.getPublicKey())
    })
}

export default function (req: Request, res: Response, next: NextFunction) {
    const header = req.headers['authorization']

    if (typeof header === 'undefined') {
        throw new ApiError(403, 'Missing authentication header')
    }

    const token = header.split(' ')[1]

    jwt.verify(token, getKey, {
        issuer: `https://sts.windows.net/${process.env.ENTRA_TENANT_ID}/`
    }, (err, decoded) => {
        if (err) return next(new ApiError(403, `Token verification failed: ${err.message}`))
        req.user = decoded as { roles?: string[], [key: string]: unknown }
        next()
    })
}
