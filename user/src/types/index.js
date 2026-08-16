/**
 * Shared shapes, documented as JSDoc typedefs so editors get autocomplete
 * without adding TypeScript to the build. These mirror the contracts the
 * backend will expose — keep them in sync when the API lands.
 */

/**
 * @typedef {Object} Guest
 * @property {string} id
 * @property {string} slug            Segment used in /guest/:guestId
 * @property {string[]} linkSlugs     Alternate slugs a host may share
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {?string} avatar
 * @property {string} propertyId
 * @property {number} partySize
 * @property {boolean} returning
 * @property {Stay} stay
 * @property {GuestPreferences} preferences
 * @property {Memory[]} memories      Vitoria's personalisation memory
 * @property {string[]} savedPlaceIds
 */

/**
 * @typedef {Object} Stay
 * @property {string} checkInDate   YYYY-MM-DD
 * @property {string} checkOutDate  YYYY-MM-DD
 * @property {string} checkInTime
 * @property {string} checkOutTime
 * @property {number} nights
 * @property {string} confirmationCode
 * @property {number} adults
 * @property {number} children
 */

/**
 * @typedef {Object} GuestPreferences
 * @property {string[]} cuisines
 * @property {string[]} dietary
 * @property {boolean} travelingWithKids
 * @property {number[]} kidAges
 * @property {string[]} activities
 * @property {string} pace
 * @property {string} budget
 */

/**
 * @typedef {Object} Memory
 * @property {string} id
 * @property {string} note
 * @property {string} source
 */

/**
 * @typedef {Object} Property
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} community
 * @property {string} address
 * @property {{lat:number,lng:number}} coordinates
 * @property {string} heroImage
 * @property {string[]} gallery
 * @property {string} checkIn
 * @property {string} checkOut
 * @property {{network:string,password:string,note:string}} wifi
 * @property {{method:string,code:string,instructions:string,parking:string,trash:string}} access
 * @property {string[]} checkInSteps
 * @property {string[]} checkOutSteps
 * @property {string[]} houseRules
 * @property {string[]} amenities
 * @property {{label:string,value:string,type:string}[]} emergency
 * @property {Host} host
 */

/**
 * @typedef {Object} Host
 * @property {string} name
 * @property {string} company
 * @property {string} phone
 * @property {string} email
 * @property {string} avatar
 * @property {string} responseTime
 */

/**
 * A partner listing. Restaurants share this shape with a few extra fields.
 * @typedef {Object} Partner
 * @property {string} id
 * @property {'partner'|'restaurant'|'beach'} type
 * @property {string} name
 * @property {string} category
 * @property {string[]} tags
 * @property {string} shortDescription
 * @property {string} description
 * @property {string} image
 * @property {string[]} gallery
 * @property {number} rating
 * @property {number} reviewCount
 * @property {?number} startingPrice
 * @property {?string} priceUnit
 * @property {number} [priceLevel]
 * @property {string} phone
 * @property {string} website
 * @property {string} location
 * @property {string} address
 * @property {{lat:number,lng:number}} coordinates
 * @property {number} distance  Miles from the property
 * @property {Object.<string,string>} hours
 * @property {string[]} services
 * @property {string} [vitoriaNote]
 * @property {boolean} [featured]
 */

/**
 * @typedef {Object} EventItem
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} date
 * @property {string} time
 * @property {string} location
 * @property {string} image
 * @property {string} description
 * @property {?string} externalUrl  Partner-owned reservation link
 */

/**
 * @typedef {'pending'|'confirmed'|'shopping'|'on_the_way'|'delivered'|'cancelled'} GroceryStatus
 * @typedef {'pending'|'confirmed'|'payment_required'|'scheduled'|'completed'|'cancelled'} TransferStatus
 * @typedef {'not_required'|'authorization_required'|'authorized'|'payment_required'|'paid'|'captured'|'refunded'|'failed'} PaymentState
 */

/**
 * @typedef {Object} Payment
 * @property {PaymentState} state
 * @property {?string} method
 * @property {?string} authorizedAt
 * @property {?string} capturedAt
 * @property {?number} amount
 */

/**
 * @typedef {Object} GroceryOrder
 * @property {string} id
 * @property {GroceryStatus} status
 * @property {string} deliveryDate
 * @property {string} deliveryWindow
 * @property {string} store
 * @property {string} items       Newline-separated list
 * @property {string} notes
 * @property {Payment} payment
 * @property {{status:string,at:string,note:string}[]} timeline
 * @property {?number} tip
 * @property {?{stars:number,feedback:string}} rating
 */

/**
 * @typedef {Object} Transfer
 * @property {string} id
 * @property {TransferStatus} status
 * @property {'ECP'|'VPS'|'PNS'} airport
 * @property {string} date
 * @property {string} time
 * @property {string} flightNumber
 * @property {number} passengers
 * @property {number} bags
 * @property {Payment} payment
 * @property {?{name:string,vehicle:string,phone:string}} driver
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user'|'assistant'} role
 * @property {string} at    ISO timestamp
 * @property {string} text
 * @property {{kind:string,refId:string}[]} [cards]
 * @property {{label:string,to:string,icon:string}[]} [actions]
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} icon
 * @property {string} title
 * @property {string} message
 * @property {string} createdAt
 * @property {boolean} read
 * @property {string} link
 */

export {}
