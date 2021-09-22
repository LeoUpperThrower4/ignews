import { fauna } from "../../../services/fauna";
import { query as q } from 'faunadb'
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  const userRef = await fauna.query(
    q.Select(
      "ref",
      q.Get(
        q.Match(
          q.Index('user_by_stripe_customer_id'),
          customerId
        )
      )
    )
  )

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  }

  if (createAction) {
    // await fauna.query(
    //   q.Create(
    //     q.Collection('subscriptions'),
    //     { data: subscriptionData }
    //   )
    // )
    // Minha solução para evitar duplicados
    await fauna.query(
      q.If(
        q.Not(
          q.Exists(
            q.Match(
              q.Index('subscription_by_id'),
              q.Casefold(subscription.id)
            )
          )
        ),
        q.Create(
          q.Collection('subscriptions'),
          { data: subscriptionData }
        ),
        q.Replace(
          q.Select(
            "ref",
            q.Get(
              q.Match(
                q.Index('subscription_by_id'),
                subscriptionId
              )
            )
          ),
          { data: subscriptionData }
        ),
      )
    )
  } else {
    await fauna.query(
      q.Replace(
        q.Select(
          "ref",
          q.Get(
            q.Match(
              q.Index('subscription_by_id'),
              subscriptionId
            )
          )
        ),
        { data: subscriptionData }
      ),
    )
  }
}