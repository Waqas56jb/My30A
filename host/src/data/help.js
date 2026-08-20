import { HOST_CONTACT } from '../config/contact'

export const helpTopics = [
  {
    id: 'getting-started',
    title: 'Getting started',
    icon: 'play',
    articles: [
      {
        q: 'What does My30A Host actually do?',
        a: 'It is where you enter the private information about your property — WiFi, door codes, check-in, house rules — and where you generate the link your guests use. Once a guest opens that link, Vitoria can answer their questions about your house and about 30A, and you see what they asked.',
      },
      {
        q: 'How long does setup take?',
        a: 'About fifteen minutes for the first property if you have the door code and WiFi password to hand. The setup checklist on your dashboard shows exactly what is left, and you can save and come back at any point.',
      },
      {
        q: 'Do I have to pay for this?',
        a: 'No. The guest experience is free for everyone, and there is no host subscription to set up. You only need an account so that private property information stays private.',
      },
    ],
  },
  {
    id: 'guest-access',
    title: 'How guest access works',
    icon: 'key',
    articles: [
      {
        q: 'How do my guests get in?',
        a: 'Publishing a property generates a unique link and QR code. Send the link with your booking confirmation, and put the QR code on the welcome card or inside the front door. Anyone who opens it sees your property information; anyone without it only sees the public 30A content.',
      },
      {
        q: 'What can a guest see that the public cannot?',
        a: 'WiFi, check-in and check-out instructions, door and access codes, house rules, parking, emergency contacts, and your own local recommendations. Beaches, restaurants, events, and local partners are public to everyone.',
      },
      {
        q: 'Can I turn access off?',
        a: 'Yes. Pausing a property disables guest access immediately without deleting anything — existing links stop opening until you publish again. You can also regenerate the link, which invalidates the old one.',
      },
    ],
  },
  {
    id: 'property-info',
    title: 'Managing property information',
    icon: 'building',
    articles: [
      {
        q: 'How do I add or change the WiFi?',
        a: 'Open your property, choose WiFi, and enter the network name and password. It saves immediately and guests see the change the next time they open their link. The password is masked in this panel by default.',
      },
      {
        q: 'How do I update check-in instructions?',
        a: 'Property → Check-in. Anything you write in the arrival and keypad fields is what Vitoria reads back to a guest who asks how to get in, so be specific about which door and which gate.',
      },
      {
        q: 'What makes a good house rule?',
        a: 'Short, specific, and explained. “Quiet hours 10 PM – 8 AM (Rosemary Beach ordinance)” lands better than “be quiet”. You can disable a rule without deleting it if it only applies in season.',
      },
    ],
  },
  {
    id: 'vitoria',
    title: 'How guests use Vitoria',
    icon: 'sparkles',
    articles: [
      {
        q: 'What does Vitoria answer?',
        a: 'Anything about your property from the information you have entered, plus everything about 30A — beaches, restaurants, bonfires, bikes, events, and the local partners we work with. She prefers your own recommendations when she has them.',
      },
      {
        q: 'What happens when she cannot answer?',
        a: 'She tells the guest honestly rather than guessing, and flags it to you. Those show up under Vitoria as unanswered questions — each one is usually a gap in your property information that takes a minute to fill.',
      },
      {
        q: 'Do I have to reply to guests myself?',
        a: 'No. Vitoria handles the routine questions. You see summaries so you know what is being asked, and only get involved when something genuinely needs you.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Understanding your analytics',
    icon: 'grid',
    articles: [
      {
        q: 'What do partner clicks mean?',
        a: 'They count how many guests viewed a local business from your property and how many tapped through to its website or phone number. We cannot see whether they went on to book — that happens on the partner’s own site — so we never report it as a booking.',
      },
      {
        q: 'Where does the satisfaction score come from?',
        a: 'Guests are asked to rate their stay at check-out and to rate individual services they used. The score is the average of those responses for the selected property and period.',
      },
    ],
  },
]

export const supportContact = {
  email: HOST_CONTACT.email,
  hours: HOST_CONTACT.hours,
  responseTime: HOST_CONTACT.responseTime,
  instagram: HOST_CONTACT.instagram,
  facebook: HOST_CONTACT.facebook,
}
