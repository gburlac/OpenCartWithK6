import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export default function () {
  const response = '<div class="message">Message 1</div><div class="message">Message 2</div>';

  const message = findBetween(response, '<div class="message">', '</div>');

  console.log(message); // Message 1

  const allMessages = findBetween(response, '<div class="message">', '</div>', true);
  console.log(allMessages.length); // 2
}