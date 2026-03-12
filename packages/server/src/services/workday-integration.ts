import WorkdayError from '../errors/workday-error.js'
import dummyData from '../../sample_data/workday_response.json' with { type: 'json' }

export async function requestToken(): Promise<string> {
    const endpoint = `https://${process.env.WORKDAY_DOMAIN}/ccx/oauth2/${process.env.WORKDAY_TENANT}/token`
    const encodedCredentials = Buffer.from(`${process.env.WORKDAY_CLIENT_ID}:${process.env.WORKDAY_CLIENT_SECRET}`).toString('base64')
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.WORKDAY_REFRESH_TOKEN!
        })
    })

    if (!response.ok) throw new WorkdayError(response.status, 'Workday oauth token request failed')
    const json = await response.json() as { access_token?: string }

    if (!json.access_token) throw new WorkdayError(response.status, 'Workday response missing access token')
    return json.access_token
}

export async function getWorkdayProjects(): Promise<unknown[]> {
    if (process.env.USE_MOCK_WORKDAY === 'true') {
        return (dummyData as { data: unknown[] }).data
    }

    const token = await requestToken()
    const endpoint = `https://${process.env.WORKDAY_DOMAIN}/ccx/api/v1/${process.env.WORKDAY_TENANT}/projects`
    const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new WorkdayError(response.status, 'Workday projects endpoint request failed')
    const json = await response.json() as { data?: unknown[] }

    if (!json.data) throw new WorkdayError(response.status, 'Workday response missing data field')
    return json.data
}
