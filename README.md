# Unsend REST Email Adapter

This adapter allows PayloadCMS to send emails using the [Unsend](https://unsend.dev) REST API.

[![npm version](https://img.shields.io/npm/v/@rubixstudios/payload-unsend.svg)](https://www.npmjs.com/package/@rubixstudios/payload-unsend)

## Installation

```sh
pnpm add @rubixstudios/payload-unsend
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
import { unsendAdapter } from '@rubixstudios/payload-unsend'

export default buildConfig({
  email: unsendAdapter({
    defaultFromAddress: 'hello@rubixstudios.com.au',
    defaultFromName: 'Rubix Studios',
    apiKey: process.env.UNSEND_API_KEY || '',
    unsendurl: process.env.UNSEND_URL || 'https://rubixstudios.com.au'
  }),
})
```
