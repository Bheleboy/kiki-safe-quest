export interface QuizQuestion {
  question: string;
  options: { label: string; emoji: string }[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  videoFallbackUrl?: string;
  narrationText: string;
  explanationText: string;
  quiz: QuizQuestion[];
  parentTip: string;
}

export interface Module {
  id: string;
  title: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
}

export interface AgeStream {
  id: "6-9" | "10-13";
  label: string;
  description: string;
  emoji: string;
  gradient: string;
  modules: Module[];
}

export const courseData: AgeStream[] = [
  {
    id: "6-9",
    label: "Ages 6–9",
    description: "Fun animated lessons about staying safe online!",
    emoji: "🧸",
    gradient: "gradient-young",
    modules: [
      {
        id: "young-m1",
        title: "What is the Internet?",
        emoji: "🌐",
        color: "primary",
        lessons: [
          {
            id: "young-m1-l1",
            title: "The Internet – A Big Playground!",
            videoUrl: "https://www.youtube.com/embed/gVoHRKIIFGg",
            narrationText: "The internet is like a big library and playground. You can learn, play, and talk to friends. But just like in a real playground, there are rules to stay safe!",
            explanationText: "The internet connects computers all around the world. You can use it to watch videos, play games, learn new things, and talk to people. It's amazing, but we need to be careful too!",
            quiz: [
              {
                question: "The internet is like...",
                options: [
                  { label: "A playground", emoji: "🛝" },
                  { label: "A library", emoji: "📚" },
                  { label: "Both!", emoji: "🎉" },
                ],
                correctIndex: 2,
                explanation: "The internet is like BOTH a playground and a library! You can play AND learn!",
              },
              {
                question: "Can you learn new things on the internet?",
                options: [
                  { label: "Yes!", emoji: "✅" },
                  { label: "No", emoji: "❌" },
                ],
                correctIndex: 0,
                explanation: "Yes! The internet has lots of cool things to learn about!",
              },
            ],
            parentTip: "Talk to your child about what websites and apps they enjoy. Explore them together to understand what they're engaging with online.",
          },
        ],
      },
      {
        id: "young-m2",
        title: "SMART Rules",
        emoji: "🛡️",
        color: "coral",
        lessons: [
          {
            id: "young-m2-l1",
            title: "S – Stay Safe Online",
            videoUrl: "https://www.youtube.com/embed/TqPCnOsq_Mo",
            narrationText: "Stay safe! Never share your name, address, phone number, or school with strangers online. Keep your personal information private!",
            explanationText: "The S in SMART stands for SAFE. Keep your personal information safe. Don't tell strangers your real name, where you live, or where you go to school.",
            quiz: [
              {
                question: "Which should you NEVER share with strangers online?",
                options: [
                  { label: "Your favorite color", emoji: "🎨" },
                  { label: "Your home address", emoji: "🏠" },
                  { label: "Your favorite animal", emoji: "🐶" },
                ],
                correctIndex: 1,
                explanation: "Never share your home address with strangers online! Keep it private.",
              },
              {
                question: "Is it okay to share your school name online?",
                options: [
                  { label: "Yes, everyone should know!", emoji: "🏫" },
                  { label: "No, keep it private!", emoji: "🔒" },
                ],
                correctIndex: 1,
                explanation: "Keep your school name private! Strangers don't need to know where you go to school.",
              },
              {
                question: "What does the S in SMART stand for?",
                options: [
                  { label: "Smart", emoji: "🧠" },
                  { label: "Safe", emoji: "🛡️" },
                  { label: "Silly", emoji: "🤪" },
                ],
                correctIndex: 1,
                explanation: "S stands for SAFE! Always stay safe online.",
              },
            ],
            parentTip: "Practice with your child what information is okay to share and what isn't. Role-play scenarios where someone online asks for personal details.",
          },
          {
            id: "young-m2-l2",
            title: "M – Meeting People Online",
            videoUrl: "https://www.youtube.com/embed/UMjCc4pJfPg",
            narrationText: "Meeting people! People online might not be who they say they are. Never meet someone from the internet without telling a grown-up first!",
            explanationText: "The M in SMART stands for MEETING. People online might pretend to be someone they're not. Never agree to meet someone you only know from the internet. Always tell a parent or guardian.",
            quiz: [
              {
                question: "An online friend wants to meet you. What do you do?",
                options: [
                  { label: "Go meet them alone!", emoji: "🏃" },
                  { label: "Tell a grown-up first!", emoji: "👨‍👩‍👧" },
                  { label: "Ignore the message", emoji: "🙈" },
                ],
                correctIndex: 1,
                explanation: "Always tell a grown-up! Never meet online friends without an adult knowing.",
              },
            ],
            parentTip: "Explain that people online can pretend to be anyone. Encourage your child to always come to you if someone asks to meet in person.",
          },
          {
            id: "young-m2-l3",
            title: "A – Accepting Content",
            videoUrl: "https://www.youtube.com/embed/QKe-aO44R7k",
            narrationText: "Accepting things! Be careful about clicking links or downloading things. Some files can have viruses that hurt your computer!",
            explanationText: "The A in SMART stands for ACCEPTING. Don't click on links or download files from people you don't know. They might contain viruses or bad content.",
            quiz: [
              {
                question: "A stranger sends you a link. What should you do?",
                options: [
                  { label: "Click it right away!", emoji: "👆" },
                  { label: "Don't click it – tell an adult!", emoji: "🛑" },
                ],
                correctIndex: 1,
                explanation: "Don't click links from strangers! They could be dangerous. Tell an adult.",
              },
            ],
            parentTip: "Show your child examples of suspicious links and pop-ups. Teach them to ask before clicking anything unfamiliar.",
          },
          {
            id: "young-m2-l4",
            title: "R – Reliable Information",
            videoUrl: "https://www.youtube.com/embed/MHvY1RfRJSY",
            narrationText: "Reliable info! Not everything you read online is true. Some websites have wrong information. Always check with a grown-up!",
            explanationText: "The R in SMART stands for RELIABLE. Not everything on the internet is true! Some people put wrong information online. Always check facts with a trusted adult or website.",
            quiz: [
              {
                question: "Is everything on the internet true?",
                options: [
                  { label: "Yes, always!", emoji: "✅" },
                  { label: "No, some things are wrong!", emoji: "🤔" },
                ],
                correctIndex: 1,
                explanation: "Not everything online is true! Always double-check important information.",
              },
            ],
            parentTip: "Help your child understand that anyone can put information online. Practice checking facts together using trusted sources.",
          },
          {
            id: "young-m2-l5",
            title: "T – Tell an Adult",
            videoUrl: "https://www.youtube.com/embed/6RRyVPmtL9I",
            narrationText: "Tell an adult! If something online makes you feel scared, sad, or confused, always tell a grown-up you trust. They can help!",
            explanationText: "The T in SMART stands for TELL. If anything online makes you worried or uncomfortable, tell a parent, teacher, or trusted adult right away. You won't get in trouble!",
            quiz: [
              {
                question: "Something online scared you. What do you do?",
                options: [
                  { label: "Keep it secret", emoji: "🤫" },
                  { label: "Tell a trusted adult!", emoji: "🗣️" },
                ],
                correctIndex: 1,
                explanation: "Always tell a trusted adult! They can help you and you won't get in trouble.",
              },
            ],
            parentTip: "Create an open environment where your child feels comfortable coming to you about anything they encounter online. Reassure them they won't get in trouble.",
          },
        ],
      },
      {
        id: "young-m3",
        title: "Be Kind Online",
        emoji: "💛",
        color: "secondary",
        lessons: [
          {
            id: "young-m3-l1",
            title: "Kindness on the Internet",
            videoUrl: "https://www.youtube.com/embed/PGSCnMx0gLo",
            narrationText: "Being kind online is just as important as being kind in person! Use nice words, be helpful, and think before you type!",
            explanationText: "The internet is a better place when everyone is kind! Think about how your words might make others feel. If you wouldn't say it to someone's face, don't type it online.",
            quiz: [
              {
                question: "Which message is kind?",
                options: [
                  { label: "\"You're terrible at this game!\"", emoji: "😡" },
                  { label: "\"Great job, keep trying!\"", emoji: "😊" },
                  { label: "\"LOL you're so dumb\"", emoji: "😢" },
                ],
                correctIndex: 1,
                explanation: "\"Great job, keep trying!\" is kind and encouraging! Always use nice words online.",
              },
              {
                question: "Before posting something, you should...",
                options: [
                  { label: "Think about how others feel", emoji: "💭" },
                  { label: "Just post it quickly", emoji: "⚡" },
                ],
                correctIndex: 0,
                explanation: "Always think about how your words might make others feel before posting!",
              },
            ],
            parentTip: "Discuss examples of kind vs unkind online behavior with your child. Model positive online interactions yourself.",
          },
        ],
      },
    ],
  },
  {
    id: "10-13",
    label: "Ages 10–13",
    description: "Learn to protect yourself and be smart online!",
    emoji: "🚀",
    gradient: "gradient-teen",
    modules: [
      {
        id: "teen-m1",
        title: "Internet Safety 101",
        emoji: "🌐",
        color: "primary",
        lessons: [
          {
            id: "teen-m1-l1",
            title: "What is the Internet?",
            videoUrl: "https://www.youtube.com/embed/gVoHRKIIFGg",
            narrationText: "The internet is a global network connecting billions of devices. It's an incredible tool for learning, communication, and entertainment — but it comes with responsibilities.",
            explanationText: "The internet connects computers worldwide through a network of servers. Understanding how it works helps you make smarter choices about what you share, click, and trust online.",
            quiz: [
              {
                question: "What is the internet?",
                options: [
                  { label: "A single computer", emoji: "💻" },
                  { label: "A network of connected devices", emoji: "🌐" },
                  { label: "A video game", emoji: "🎮" },
                ],
                correctIndex: 1,
                explanation: "The internet is a massive network of connected devices sharing information worldwide!",
              },
              {
                question: "Why is it important to learn about internet safety?",
                options: [
                  { label: "To win games faster", emoji: "🏆" },
                  { label: "To protect yourself online", emoji: "🛡️" },
                  { label: "It's not important", emoji: "🤷" },
                ],
                correctIndex: 1,
                explanation: "Learning internet safety helps you protect yourself and your personal information!",
              },
            ],
            parentTip: "Discuss your family's internet usage together. Set expectations about screen time and which sites/apps are appropriate.",
          },
        ],
      },
      {
        id: "teen-m2",
        title: "Privacy & Passwords",
        emoji: "🔐",
        color: "mint",
        lessons: [
          {
            id: "teen-m2-l1",
            title: "Creating Strong Passwords",
            videoUrl: "https://www.youtube.com/embed/aEmF3Iylvr4",
            narrationText: "Your password is like a key to your digital life. A strong password uses a mix of letters, numbers, and symbols. Never share your passwords with friends!",
            explanationText: "Strong passwords are at least 12 characters long and include uppercase letters, lowercase letters, numbers, and symbols. Never use your name, birthday, or common words. Use different passwords for different accounts.",
            quiz: [
              {
                question: "Which is the STRONGEST password?",
                options: [
                  { label: "password123", emoji: "😰" },
                  { label: "MyD0g$Name!2024", emoji: "💪" },
                  { label: "abc", emoji: "😢" },
                ],
                correctIndex: 1,
                explanation: "MyD0g$Name!2024 is strong because it has letters, numbers, symbols, and is long!",
              },
              {
                question: "Should you share your password with your best friend?",
                options: [
                  { label: "Yes, they're my friend!", emoji: "👫" },
                  { label: "No, passwords are private!", emoji: "🔒" },
                ],
                correctIndex: 1,
                explanation: "Never share passwords — not even with best friends! Only trusted adults should know.",
              },
              {
                question: "How often should you change your passwords?",
                options: [
                  { label: "Never", emoji: "❌" },
                  { label: "Regularly, especially if compromised", emoji: "🔄" },
                  { label: "Every hour", emoji: "⏰" },
                ],
                correctIndex: 1,
                explanation: "Change passwords regularly and immediately if you think someone else knows them!",
              },
            ],
            parentTip: "Help your child create strong, memorable passwords. Consider using a family password manager and discuss why sharing passwords is risky.",
          },
        ],
      },
      {
        id: "teen-m3",
        title: "Protect Your Profile",
        emoji: "👤",
        color: "purple-fun",
        lessons: [
          {
            id: "teen-m3-l1",
            title: "5 Ways to Stay Private Online",
            videoUrl: "https://www.youtube.com/embed/HxySrSbSY7o",
            narrationText: "Your online profile tells the world about you. Make sure you're only sharing what you want everyone to see. Check your privacy settings on every app and social media!",
            explanationText: "1. Set profiles to private. 2. Think before you post — would you show it to a teacher? 3. Don't share your location. 4. Be careful with photos. 5. Review your friends/followers list regularly.",
            quiz: [
              {
                question: "Your social media profile should be...",
                options: [
                  { label: "Public so everyone can see", emoji: "🌍" },
                  { label: "Private so only friends see", emoji: "🔐" },
                ],
                correctIndex: 1,
                explanation: "Keep your profile private! Only people you know and trust should see your posts.",
              },
              {
                question: "Before posting a photo, you should think...",
                options: [
                  { label: "\"Will this get lots of likes?\"", emoji: "❤️" },
                  { label: "\"Would I be okay showing this to a teacher?\"", emoji: "🤔" },
                ],
                correctIndex: 1,
                explanation: "If you wouldn't show it to a teacher or grandparent, don't post it online!",
              },
              {
                question: "Which of these should you NOT share online?",
                options: [
                  { label: "Your favorite movie", emoji: "🎬" },
                  { label: "Your current location", emoji: "📍" },
                  { label: "A book you liked", emoji: "📖" },
                ],
                correctIndex: 1,
                explanation: "Never share your current location online — it tells strangers where to find you!",
              },
            ],
            parentTip: "Sit with your child and review the privacy settings on their apps and social media accounts together. Make it a regular activity.",
          },
        ],
      },
      {
        id: "teen-m4",
        title: "Cyberbullying & Respect",
        emoji: "🤝",
        color: "coral",
        lessons: [
          {
            id: "teen-m4-l1",
            title: "Standing Up to Cyberbullying",
            videoUrl: "https://www.youtube.com/embed/Jwu_7IqWh8Y",
            narrationText: "Cyberbullying is when someone uses technology to hurt, embarrass, or threaten others. If it happens to you, don't respond — save the evidence and tell a trusted adult.",
            explanationText: "Cyberbullying includes mean messages, sharing embarrassing photos, excluding someone on purpose, or spreading rumors online. It's never okay, and it's not your fault. Always report it!",
            quiz: [
              {
                question: "If someone is being mean to you online, you should...",
                options: [
                  { label: "Be mean back to them", emoji: "😤" },
                  { label: "Save it and tell an adult", emoji: "📸" },
                  { label: "Delete everything", emoji: "🗑️" },
                ],
                correctIndex: 1,
                explanation: "Save the evidence (screenshots) and tell a trusted adult. Don't respond to the bully!",
              },
              {
                question: "Is it cyberbullying to share someone's embarrassing photo without asking?",
                options: [
                  { label: "Yes, that's cyberbullying", emoji: "⚠️" },
                  { label: "No, it's just funny", emoji: "😂" },
                ],
                correctIndex: 0,
                explanation: "Sharing someone's embarrassing photos without permission IS cyberbullying. Always ask before sharing!",
              },
            ],
            parentTip: "Discuss what cyberbullying looks like and reassure your child they can always come to you. Teach them how to block and report on different platforms.",
          },
        ],
      },
      {
        id: "teen-m5",
        title: "Scams & Phishing",
        emoji: "🎣",
        color: "secondary",
        lessons: [
          {
            id: "teen-m5-l1",
            title: "Spotting Scams Online",
            videoUrl: "https://www.youtube.com/embed/XCF_wMBqXuY",
            narrationText: "Scammers try to trick you into giving away your information or money. They might pretend to be a company you trust. Learn to spot the signs!",
            explanationText: "Phishing is when scammers send fake emails or messages pretending to be real companies. Look for: spelling mistakes, urgent language, requests for personal info, and suspicious links. When in doubt, don't click!",
            quiz: [
              {
                question: "You get an email saying \"You won $1000! Click here!\" This is probably...",
                options: [
                  { label: "Real – I'm so lucky!", emoji: "🤩" },
                  { label: "A scam – delete it!", emoji: "🚫" },
                ],
                correctIndex: 1,
                explanation: "If it sounds too good to be true, it probably is! This is a classic phishing scam.",
              },
              {
                question: "Which is a sign of a phishing email?",
                options: [
                  { label: "Comes from a trusted email address", emoji: "✅" },
                  { label: "Has spelling mistakes and urgent language", emoji: "⚠️" },
                  { label: "Has a normal subject line", emoji: "📧" },
                ],
                correctIndex: 1,
                explanation: "Phishing emails often have spelling mistakes, urgent language like \"ACT NOW!\", and suspicious links.",
              },
            ],
            parentTip: "Show your child real examples of phishing emails (from your spam folder). Practice identifying the red flags together.",
          },
        ],
      },
    ],
  },
];

export const searchableTopics = [
  { keyword: "privacy", lessonIds: ["teen-m2-l1", "teen-m3-l1", "young-m2-l1"] },
  { keyword: "password", lessonIds: ["teen-m2-l1"] },
  { keyword: "bullying", lessonIds: ["teen-m4-l1"] },
  { keyword: "cyberbullying", lessonIds: ["teen-m4-l1"] },
  { keyword: "safe", lessonIds: ["young-m2-l1", "young-m2-l5", "teen-m1-l1"] },
  { keyword: "kind", lessonIds: ["young-m3-l1"] },
  { keyword: "scam", lessonIds: ["teen-m5-l1"] },
  { keyword: "phishing", lessonIds: ["teen-m5-l1"] },
  { keyword: "stranger", lessonIds: ["young-m2-l1", "young-m2-l2"] },
  { keyword: "meeting", lessonIds: ["young-m2-l2"] },
  { keyword: "profile", lessonIds: ["teen-m3-l1"] },
  { keyword: "internet", lessonIds: ["young-m1-l1", "teen-m1-l1"] },
  { keyword: "trust", lessonIds: ["young-m2-l4", "teen-m1-l1"] },
  { keyword: "reliable", lessonIds: ["young-m2-l4"] },
  { keyword: "posts", lessonIds: ["teen-m3-l1", "young-m3-l1"] },
  { keyword: "links", lessonIds: ["young-m2-l3", "teen-m5-l1"] },
];
