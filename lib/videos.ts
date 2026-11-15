export type Video = {
  id: string; // youtube.com/watch?v= এর পরের অংশ
  start?: number; // কত সেকেন্ড থেকে শুরু (ঐচ্ছিক)
  title?: string; // ঐচ্ছিক। খালি থাকলে কার্ডে নাম দেখাবে না
};

// নতুন ভিডিও যোগ করতে এখানে একটা লাইন বাড়ান
export const HOME_VIDEOS: Video[] = [
  { id: "xi23nj5BYMk", start: 35 },
  { id: "Ow5RS1guvpk", start: 235 },
];