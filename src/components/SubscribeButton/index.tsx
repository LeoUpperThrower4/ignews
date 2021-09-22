import { getStripeJs } from '../../services/stripe-js'
import { signIn, useSession } from 'next-auth/client'
import styles from './styles.module.scss'
import { api } from '../../services/api'
import router from 'next/router'

interface SubscribeButtonProps {
  priceId: string,
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [session] = useSession()
  async function handleSubscribe() {
    if (!session) {
      await signIn('github')
      return
    }
    if (session.userActiveSubscription) {
      router.push('/posts')
      return
    }
    try {
      const response = await api.post('/subscribe')

      const { sessionId } = response.data
      const stripe = await getStripeJs()

      await stripe.redirectToCheckout({ sessionId })
    } catch (error) {
      alert(error.message)
    }
  }
  return (
    <button
      type='button'
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  )
}