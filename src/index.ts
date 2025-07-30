import type { EmailAdapter, SendEmailOptions } from 'payload'

import { APIError } from 'payload'

export type UnsendAdapterArgs = {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
  scheduledAt?: string
  templateId?: string
  unsendurl: string
  variables?: Record<string, string>
}

type UnsendAdapter = EmailAdapter<UnsendResponse>

type UnsendError = {
  error: {
    code: string
    message: string
  }
}

type UnsendResponse = { emailId: string } | UnsendError

/**
 * Email adapter for [Unsend](https://unsend.dev) REST API
 */
export const unsendAdapter = (args: UnsendAdapterArgs): UnsendAdapter => {
  const { apiKey, defaultFromAddress, defaultFromName, scheduledAt, templateId, unsendurl, variables } = args

  const adapter: UnsendAdapter = () => ({
    name: 'unsend-rest',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      const sendEmailOptions = mapPayloadEmailToUnsendEmail(
        message,
        defaultFromAddress,
        defaultFromName,
      )

      const payload = {
        ...sendEmailOptions,
        ...(scheduledAt ? { scheduledAt } : {}),
        ...(templateId ? { templateId } : {}),
        ...(variables ? { variables } : {}),
      }

      const res = await fetch(`${unsendurl}/api/v1/emails`, {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = (await res.json()) as UnsendResponse
      
      if ('emailId' in data) {
        return data
      } else {
        const statusCode = res.status
        let formattedError = `Error sending email: ${statusCode}`
        if ('error' in data) {
          formattedError += ` ${data.error.code} - ${data.error.message}`
        }

        throw new APIError(formattedError, statusCode)
      }
    },
  })

  return adapter
}

function mapPayloadEmailToUnsendEmail(
  message: SendEmailOptions,
  defaultFromAddress: string,
  defaultFromName: string,
): UnsendSendEmailOptions {
  const emailOptions: Partial<UnsendSendEmailOptions> = {
    from: mapFromAddress(message.from, defaultFromName, defaultFromAddress),
    subject: message.subject ?? 'No subject provided',
    to: mapAddresses(message.to),
  }

  if (message.html && message.html.toString().trim().length > 0) {
    emailOptions.html = message.html.toString()
  }

  if (message.text && message.text.toString().trim().length > 0) {
    emailOptions.text = message.text;
  } else {
    emailOptions.text = 'Please view this email in an HTML-compatible client.';
  }
  
  if (message.attachments?.length) {
    emailOptions.attachments = mapAttachments(message.attachments)
  }
  if (message.bcc && message.bcc.length > 0) {
    emailOptions.bcc = mapAddresses(message.bcc)
  }
  if (message.cc && message.cc.length > 0) {
    emailOptions.cc = mapAddresses(message.cc)
  }
  if (message.replyTo && message.replyTo.length > 0) {
    emailOptions.replyTo = mapAddresses(message.replyTo)
  }

  return emailOptions as UnsendSendEmailOptions
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
        content: Buffer.from(attachment.content).toString('base64'),
        filename: attachment.filename,
      }
    }

    if (attachment.content instanceof Buffer) {
      return {
        content: attachment.content.toString('base64'),
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
   * The date and time to send the email. If not provided, the email will be sent immediately.
   * 
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-scheduled-at
   */
  scheduledAt?: string
  /**
   * Email subject.
   *
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-subject
   */
  subject?: string
  /**
   * The unique identifier of the template to use for this email.
   * 
   * @link https://docs.unsend.dev/api-reference/emails/send-email#body-template-id
   */
  templateId?: string
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
   * Email template variables. Allows for dynamic content in the email template.
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
