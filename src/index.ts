import type { EmailAdapter, SendEmailOptions } from 'payload'

import { APIError } from 'payload'

export type UnsendAdapterArgs = {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
  unsendurl: string
}

type UnsendAdapter = EmailAdapter<UnsendResponse>

type UnsendError = {
  message: string
  name: string
  statusCode: number
}

type UnsendResponse = { emailId: string } | UnsendError

/**
 * Email adapter for [Unsend](https://unsend.dev) REST API
 */
export const unsendAdapter = (args: UnsendAdapterArgs): UnsendAdapter => {
  const { apiKey, defaultFromAddress, defaultFromName, unsendurl } = args

  const adapter: UnsendAdapter = () => ({
    name: 'unsend-rest',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      try {
      // Map the Payload email options to Unsend email options
      const sendEmailOptions = mapPayloadEmailToUnsendEmail(
        message,
        defaultFromAddress,
        defaultFromName,
      )

      const res = await fetch(`${unsendurl}/api/v1/emails`, {
        body: JSON.stringify(sendEmailOptions),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = (await res.json()) as UnsendResponse

    if ('emailId' in data) {
      return data
    }

    // If we get here, it's an error response
        throw new APIError(JSON.stringify({
          error: 'Email sending failed',
          request: {
            options: sendEmailOptions,
            url: unsendurl,
          },
          response: {
            data,
            status: res.status,
          }
        }, null, 2), res.status)

      } catch (error) {
        // Catch any other errors (like network errors) and format them similarly
        throw new APIError(JSON.stringify({
          details: error instanceof Error ? error.message : String(error),
          error: 'Email sending failed'
        }, null, 2), 500)
      }
    }
  })

  return adapter
}

function mapPayloadEmailToUnsendEmail(
  message: SendEmailOptions,
  defaultFromAddress: string,
  defaultFromName: string,
): UnsendSendEmailOptions {
  return {
    // Required
    from: mapFromAddress(message.from, defaultFromName, defaultFromAddress),
    subject: message.subject ?? '',
    to: mapAddresses(message.to),

    // Other To fields
    bcc: mapAddresses(message.bcc),
    cc: mapAddresses(message.cc),
    replyTo: mapAddresses(message.replyTo),

    // Optional
    attachments: mapAttachments(message.attachments),
    html: message.html?.toString() || '',
    text: message.text?.toString() || '',
  } as UnsendSendEmailOptions
}

function mapFromAddress(
  address: SendEmailOptions['from'],
  defaultFromName: string,
  defaultFromAddress: string,
): UnsendSendEmailOptions['from'] {
  if (!address) {
    return `${defaultFromName} <${defaultFromAddress}>`
  }

  if (typeof address === 'string') {
    return address
  }

  return `${address.name} <${address.address}>`
}

function mapAddresses(addresses: SendEmailOptions['to']): UnsendSendEmailOptions['to'] {
  if (!addresses) {
    return ''
  }

  if (typeof addresses === 'string') {
    return addresses
  }

  if (Array.isArray(addresses)) {
    return addresses.map((address) => (typeof address === 'string' ? address : address.address))
  }

  return [addresses.address]
}

function mapAttachments(
  attachments: SendEmailOptions['attachments'],
): UnsendSendEmailOptions['attachments'] {
  if (!attachments) {
    return []
  }

  return attachments.map((attachment) => {
    if (!attachment.filename || !attachment.content) {
      throw new APIError('Attachment is missing filename or content', 400)
    }

    if (typeof attachment.content === 'string') {
      return {
        content: Buffer.from(attachment.content),
        filename: attachment.filename,
      }
    }

    if (attachment.content instanceof Buffer) {
      return {
        content: attachment.content,
        filename: attachment.filename,
      }
    }

    throw new APIError('Attachment content must be a string or a buffer', 400)
  })
}

type UnsendSendEmailOptions = {
  /**
   * Filename and content of attachments
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-attachments
   */
  attachments?: Attachment[]
  /**
   * Blind carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-bcc
   */
  bcc?: string | string[]

  /**
   * Carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-cc
   */
  cc?: string | string[]
  /**
   * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-from
   */
  from: string
  /**
   * The HTML version of the message.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-html
   */
  html?: string
  /**
   * Reply-to email address. For multiple addresses, send as an array of strings.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-reply-to
   */
  replyTo?: string | string[]
  /**
   * Email subject.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-subject
   */
  subject: string
  /**
   * The plain text version of the message.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-text
   */
  text?: string
  /**
   * Recipient email address. For multiple addresses, send as an array of strings. Max 50.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-to
   */
  to: string | string[]
  /**
   * Email variables
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-variables
   */
  variables?: Record<string, string>
}

type Attachment = {
  /** Content of an attached file. */
  content?: Buffer | string
  /** Name of attached file. */
  filename?: false | string | undefined
  /** Path where the attachment file is hosted */
  path?: string
}
