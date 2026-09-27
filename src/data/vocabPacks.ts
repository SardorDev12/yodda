export interface VocabWord {
  word: string;
  definition: string;
  example?: string;
}

export interface VocabPack {
  id: string;
  book: number;
  unit: number;
  title: string;
  theme: string;
  words: VocabWord[];
}

/**
 * Original, hand-written vocabulary packs bundled with the app. Not sourced
 * from any published textbook — the Book/Unit structure is just an
 * organizing convention. Importing a pack (see importPack in db/queries.ts)
 * copies these words into the user's own subjects/cards, so edits after
 * import never touch this data.
 */
export const VOCAB_PACKS: VocabPack[] = [
  {
    id: 'en-book1-unit1',
    book: 1,
    unit: 1,
    title: 'Book 1 · Unit 1',
    theme: 'Everyday actions',
    words: [
      { word: 'arrive', definition: 'to reach a place at the end of a journey', example: 'The train will arrive at six o’clock.' },
      { word: 'borrow', definition: 'to take something with a plan to give it back later', example: 'Can I borrow your pen for a minute?' },
      { word: 'carry', definition: 'to hold and move something from one place to another', example: 'She carried the bags up the stairs.' },
      { word: 'decide', definition: 'to choose something after thinking about it', example: 'We decided to leave early.' },
      { word: 'explain', definition: 'to make something clear by describing it', example: 'Can you explain how this works?' },
      { word: 'finish', definition: 'to complete or come to the end of something', example: 'I need to finish this report today.' },
      { word: 'gather', definition: 'to bring people or things together in one place', example: 'The class gathered around the teacher.' },
      { word: 'hide', definition: 'to put something where it cannot be seen', example: 'He hid the gift in the closet.' },
      { word: 'improve', definition: 'to make something better than it was before', example: 'Her English has improved a lot.' },
      { word: 'join', definition: 'to become part of a group or activity', example: 'Do you want to join our team?' },
      { word: 'lend', definition: 'to give something to someone for a short time, expecting it back', example: 'Could you lend me some money?' },
      { word: 'notice', definition: 'to see or become aware of something', example: 'I noticed a new sign on the door.' },
      { word: 'offer', definition: 'to say you are willing to give or do something', example: 'She offered to help with the move.' },
      { word: 'prepare', definition: 'to get something ready for use', example: 'They prepared dinner for the guests.' },
      { word: 'repeat', definition: 'to say or do something again', example: 'Could you repeat the question, please?' },
    ],
  },
  {
    id: 'en-book1-unit2',
    book: 1,
    unit: 2,
    title: 'Book 1 · Unit 2',
    theme: 'People and places',
    words: [
      { word: 'neighbor', definition: 'a person who lives near you', example: 'Our neighbor waters our plants when we travel.' },
      { word: 'stranger', definition: 'someone you do not know', example: 'Don’t open the door to strangers.' },
      { word: 'crowd', definition: 'a large group of people gathered together', example: 'A crowd formed outside the stadium.' },
      { word: 'village', definition: 'a small group of houses in the countryside', example: 'They grew up in a quiet village.' },
      { word: 'suburb', definition: 'an area on the edge of a city where people live', example: 'We moved to a suburb last year.' },
      { word: 'colleague', definition: 'a person you work with', example: 'My colleague helped me finish the project.' },
      { word: 'relative', definition: 'a member of your family', example: 'Several relatives came to the wedding.' },
      { word: 'guest', definition: 'a person invited to visit or stay somewhere', example: 'We welcomed our guests at the door.' },
      { word: 'resident', definition: 'a person who lives in a particular place', example: 'Residents can park for free on this street.' },
      { word: 'crossroad', definition: 'a place where two roads meet', example: 'Turn left at the next crossroad.' },
      { word: 'entrance', definition: 'the way into a building or place', example: 'The main entrance is around the corner.' },
      { word: 'landmark', definition: 'a building or feature that is easy to recognize', example: 'The old clock tower is a local landmark.' },
      { word: 'district', definition: 'an area of a town or city with a particular character', example: 'The old district is full of small shops.' },
      { word: 'route', definition: 'the way you take to get from one place to another', example: 'We took a shorter route home.' },
      { word: 'acquaintance', definition: 'someone you know a little, but not a close friend', example: 'He is an acquaintance from university.' },
    ],
  },
  {
    id: 'en-book1-unit3',
    book: 1,
    unit: 3,
    title: 'Book 1 · Unit 3',
    theme: 'Time and routine',
    words: [
      { word: 'schedule', definition: 'a plan that lists when things will happen', example: 'My schedule is full this week.' },
      { word: 'routine', definition: 'a set of things you regularly do in the same order', example: 'Reading before bed is part of her routine.' },
      { word: 'deadline', definition: 'the latest time by which something must be finished', example: 'The deadline for the report is Friday.' },
      { word: 'postpone', definition: 'to move something to a later time', example: 'We had to postpone the meeting.' },
      { word: 'occasionally', definition: 'sometimes, but not often', example: 'We occasionally eat out on weekends.' },
      { word: 'punctual', definition: 'arriving or doing something at the expected time', example: 'He is always punctual for meetings.' },
      { word: 'delay', definition: 'a time when something happens later than expected', example: 'There was a delay because of the weather.' },
      { word: 'frequent', definition: 'happening often', example: 'Frequent breaks help you stay focused.' },
      { word: 'momentarily', definition: 'for a very short time', example: 'She paused momentarily before answering.' },
      { word: 'overdue', definition: 'not done or paid by the time it should have been', example: 'This library book is overdue.' },
      { word: 'anticipate', definition: 'to expect something before it happens', example: 'We anticipate a busy weekend.' },
      { word: 'interval', definition: 'a period of time between two events', example: 'There is a short interval between classes.' },
      { word: 'gradually', definition: 'happening slowly over a period of time', example: 'The sky gradually turned dark.' },
      { word: 'eventually', definition: 'after some time, especially after a delay or problems', example: 'Eventually, the train arrived.' },
      { word: 'simultaneously', definition: 'happening or done at exactly the same time', example: 'Both teams finished simultaneously.' },
    ],
  },
];
