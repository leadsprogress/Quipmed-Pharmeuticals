import { config as loadEnv } from 'dotenv'
import path from 'path'

loadEnv({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const { getPayload } = await import('payload')
  const { getFieldsToSign, jwtSign } = await import('payload')
  const { addSessionToUser } = await import('payload/shared')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const user = await payload.findByID({ collection: 'users', id: 1, overrideAccess: true })
  const collectionConfig = payload.collections.users.config

  const req: any = { payload, context: {}, transactionID: undefined }
  const { sid } = await addSessionToUser({ collectionConfig, payload, req, user })

  const fieldsToSign = await getFieldsToSign({
    collectionConfig,
    email: user.email,
    user: { ...user, collection: 'users' } as any,
    sid,
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  console.log('TOKEN=' + token)
  console.log('SID=' + sid)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
