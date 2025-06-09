# Unsend REST Email Adapter

This adapter allows PayloadCMS to send emails using the [Unsend](https://unsend.dev) REST API.

[![npm version](https://img.shields.io/npm/v/@rubixstudios/email-unsend.svg)](https://www.npmjs.com/package/@rubixstudios/email-unsend)

## Installation

```sh
pnpm add @rubixstudios/email-unsend
```

## Usage

- Sign up for a [Unsend](https://unsend.dev) account
- Set up a domain
- Create an API key
- Set API key as UNSEND_API_KEY environment variable
- Set your Unsend base url as UNSEND_URL environment variable
- Configure your Payload config

```ts
// payload.config.js
import { unsendAdapter } from '@rubixstudios/email-unsend'

export default buildConfig({
  email: unsendAdapter({
    defaultFromAddress: 'hello@rubixstudios.com.au',
    defaultFromName: 'Rubix Studios',
    apiKey: process.env.UNSEND_API_KEY || '',
    unsendurl: process.env.UNSEND_URL || 'https://rubixstudios.com.au'
  }),
})
```
