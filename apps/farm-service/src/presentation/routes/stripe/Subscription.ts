import { randomUUID } from "node:crypto"

export class Subscription {
  customerId: string
  id: string
  status: string
  priceId: string
  email: string

  constructor(props: SubscriptionProps) {
    this.customerId = props.customerId
    this.id = props.id
    this.status = props.status
    this.priceId = props.priceId
    this.email = props.email
  }

  // static create(props: SubscriptionCreateProps) {
  //   return new Subscription({
  //     customerId: props.customerId,
  //     id: randomUUID(),
  //     priceId: props.priceId,
  //     status: props.status,
  //     email: props.email,
  //   })
  // }
}

type SubscriptionProps = {
  customerId: string
  id: string
  status: string
  priceId: string
  email: string
}

// type SubscriptionCreateProps = {
//   customerId: string
//   status: string
//   priceId: string
//   email: string
// }
