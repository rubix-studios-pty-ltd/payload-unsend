import type { Payload } from 'payload'

import { jest } from '@jest/globals'

import { unsendAdapter } from './index.js'

describe('payload-unsend', () => {
  const defaultFromAddress = 'hello@rubixstudios.com.au'
  const defaultFromName = 'Rubix Studios'
  const apiKey = 'test-api-key'
  const unsendurl = 'https://app.unsend.dev'
  const from = 'hello@rubixstudios.com.au'
  const to = from
  const subject = 'This was sent on init'
  const text = 'This is my message body'

  const mockPayload = {} as unknown as Payload

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle sending an email', async () => {
  global.fetch = jest.spyOn(global, 'fetch').mockImplementation(
    (_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({
        json: () => Promise.resolve({ emailId: 'test-id' }),
        ok: true,
        status: 200,
      } as Response)
  ) as unknown as typeof global.fetch

    const adapter = unsendAdapter({
      apiKey,
      defaultFromAddress,
      defaultFromName,
      unsendurl,
    })

    await adapter({ payload: mockPayload }).sendEmail({
      from,
      subject,
      text,
      to,
    })
    
    const apiURL = `${unsendurl?.replace(/\/+$/, "")}/api/v1/emails`
    // @ts-expect-error Mock fetch doesn't have a type definition
    expect(global.fetch.mock.calls[0][0]).toStrictEqual(apiURL)
    // @ts-expect-error Mock fetch doesn't have a type definition
    const request = global.fetch.mock.calls[0][1]
    expect(request.headers.Authorization).toStrictEqual(`Bearer ${apiKey}`)
    expect(JSON.parse(request.body)).toMatchObject({
      from,
      subject,
      text,
      to,
    })
  })

  it('should throw an error if the email fails to send', async () => {
    const errorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid API token'
      }
    }
    global.fetch = jest.spyOn(global, 'fetch').mockImplementation(
      (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.resolve({
          json: () => Promise.resolve(errorResponse),
          ok: false,
          status: 403,
        } as Response)
    ) as unknown as typeof global.fetch

    const adapter = unsendAdapter({
      apiKey,
      defaultFromAddress,
      defaultFromName,
      unsendurl,
    })

    await expect(() =>
      adapter({ payload: mockPayload }).sendEmail({
        from,
        subject,
        text,
        to,
      }),
    ).rejects.toThrow(
      `Error sending email: 403 ${errorResponse.error.code}`,
    )
  })
})
