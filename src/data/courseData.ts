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
  videoCredit?: string;
  videoDurationMinutes: number;
  estimatedMinutes: number;
  narrationText: string;
  explanationText: string;
  quiz: QuizQuestion[];
  parentTip: string;
}

export interface Module {
  id: string;
  title: string;
  emoji: string;
  icon?: string;
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
        icon: "eye",
        color: "primary",
        lessons: [
          {
            id: "young-m1-l1",
            title: "The Internet – A Big Playground!",
            videoUrl: "https://www.youtube.com/embed/gVoHRKIIFGg",
            videoCredit: "Childnet International",
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
          {
            id: "young-m1-l2",
            title: "How Does the Internet Work?",
            videoUrl: "https://www.youtube.com/embed/Sfzo4xm5eX8",
            videoCredit: "SciShow Kids",
            narrationText: "Have you ever wondered how the internet sends pictures and messages? It uses special cables and invisible waves to connect computers all over the world!",
            explanationText: "When you send a message online, it travels through wires and wireless signals to reach the other person's device. It's like sending a letter, but super fast! The message gets broken into tiny pieces called 'packets' that zoom around the world.",
            quiz: [
              {
                question: "How does the internet send messages?",
                options: [
                  { label: "By magic!", emoji: "🪄" },
                  { label: "Through wires and wireless signals", emoji: "📡" },
                  { label: "By post", emoji: "📬" },
                ],
                correctIndex: 1,
                explanation: "The internet uses wires and wireless signals to send information super fast!",
              },
              {
                question: "Can the internet connect to computers in other countries?",
                options: [
                  { label: "Yes, all over the world!", emoji: "🌍" },
                  { label: "No, only nearby", emoji: "🏠" },
                ],
                correctIndex: 0,
                explanation: "The internet connects computers all around the world – even on the other side!",
              },
            ],
            parentTip: "Show your child a simple map of undersea internet cables to help them visualise how the internet physically connects different countries.",
          },
          {
            id: "young-m1-l3",
            title: "Websites and Apps – What's the Difference?",
            videoUrl: "https://www.youtube.com/embed/FCBMt55CNOE",
            videoCredit: "National Cyber Security Centre",
            narrationText: "Websites are pages you visit in a browser, and apps are programs you download to your tablet or phone. Both can be fun, but always ask a grown-up before downloading anything!",
            explanationText: "A website is like a book you read in a library – you go there to look at it. An app is like a toy you take home – you download it to your device. Some apps and websites are safe, but some aren't, so always check with a grown-up!",
            quiz: [
              {
                question: "What's an app?",
                options: [
                  { label: "A page you visit online", emoji: "🌐" },
                  { label: "A program you download to your device", emoji: "📱" },
                ],
                correctIndex: 1,
                explanation: "An app is a program you download to your phone or tablet!",
              },
              {
                question: "Should you download apps without asking a grown-up?",
                options: [
                  { label: "Yes, it's fine!", emoji: "😎" },
                  { label: "No, always ask first!", emoji: "🙋" },
                ],
                correctIndex: 1,
                explanation: "Always ask a grown-up before downloading anything – some apps can be unsafe!",
              },
            ],
            parentTip: "Review the apps on your child's device together. Set up parental controls and discuss why some apps have age limits.",
          },
          {
            id: "young-m1-l4",
            title: "Good vs Bad Content Online",
            videoUrl: "https://www.youtube.com/embed/MQlJ3vOp6nI",
            videoCredit: "Common Sense Education",
            narrationText: "The internet has amazing stuff like fun videos and learning games! But it also has some content that isn't made for kids. If you ever see something that makes you feel yucky, close it and tell a grown-up!",
            explanationText: "There's lots of wonderful content on the internet – educational videos, fun games, and creative tools! But sometimes you might accidentally find something that's mean, scary, or not for children. The best thing to do is close it straight away and tell a parent or teacher.",
            quiz: [
              {
                question: "You see something online that makes you feel uncomfortable. What do you do?",
                options: [
                  { label: "Keep watching", emoji: "👀" },
                  { label: "Close it and tell a grown-up", emoji: "🚪" },
                  { label: "Show your friends", emoji: "👫" },
                ],
                correctIndex: 1,
                explanation: "Close it right away and tell a trusted grown-up! You won't get in trouble.",
              },
              {
                question: "Which of these is good content for kids?",
                options: [
                  { label: "Educational games", emoji: "🎮" },
                  { label: "Scary videos", emoji: "👻" },
                ],
                correctIndex: 0,
                explanation: "Educational games are great content for kids! Learning can be fun!",
              },
            ],
            parentTip: "Install content filters but also teach your child what to do if they stumble across inappropriate content. Make sure they know they won't be punished for reporting it.",
          },
          {
            id: "young-m1-l5",
            title: "Screen Time – Balance is Key!",
            videoUrl: "https://www.youtube.com/embed/hFnYhTn6gHQ",
            videoCredit: "GoNoodle",
            narrationText: "Being online is lots of fun, but it's important to take breaks! Play outside, read a book, draw a picture – your body and brain need different activities to stay healthy!",
            explanationText: "Too much screen time can make your eyes tired and your body stiff. It's important to balance your time online with other activities. Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds!",
            quiz: [
              {
                question: "Why is it important to take breaks from screens?",
                options: [
                  { label: "Screens are boring", emoji: "😴" },
                  { label: "Your body and eyes need rest", emoji: "💪" },
                  { label: "The internet runs out", emoji: "🔌" },
                ],
                correctIndex: 1,
                explanation: "Your eyes and body need breaks to stay healthy! Balance screen time with other activities.",
              },
              {
                question: "What's a good activity to do after screen time?",
                options: [
                  { label: "Play outside", emoji: "⚽" },
                  { label: "Read a book", emoji: "📖" },
                  { label: "Both are great!", emoji: "🌟" },
                ],
                correctIndex: 2,
                explanation: "Playing outside AND reading are both brilliant activities! Mix it up!",
              },
            ],
            parentTip: "Set clear screen time limits and model good habits yourself. Create a family media plan that includes device-free times like during meals.",
          },
        ],
      },
      {
        id: "young-m2",
        title: "SMART Rules",
        emoji: "🛡️",
        icon: "shield",
        color: "coral",
        lessons: [
          {
            id: "young-m2-l1",
            title: "S – Stay Safe Online",
            videoUrl: "https://www.youtube.com/embed/TqPCnOsq_Mo",
            videoCredit: "Childnet International",
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
            videoCredit: "Childnet International",
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
              {
                question: "Can people pretend to be someone else online?",
                options: [
                  { label: "No, everyone is honest online", emoji: "😇" },
                  { label: "Yes, people can pretend!", emoji: "🎭" },
                ],
                correctIndex: 1,
                explanation: "Yes! People can pretend to be anyone online. That's why we need to be careful.",
              },
            ],
            parentTip: "Explain that people online can pretend to be anyone. Encourage your child to always come to you if someone asks to meet in person.",
          },
          {
            id: "young-m2-l3",
            title: "A – Accepting Content",
            videoUrl: "https://www.youtube.com/embed/QKe-aO44R7k",
            videoCredit: "Childnet International",
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
              {
                question: "What might happen if you click a bad link?",
                options: [
                  { label: "Nothing at all", emoji: "😊" },
                  { label: "Your device could get a virus", emoji: "🦠" },
                ],
                correctIndex: 1,
                explanation: "Bad links can give your device a virus! Always be careful what you click.",
              },
            ],
            parentTip: "Show your child examples of suspicious links and pop-ups. Teach them to ask before clicking anything unfamiliar.",
          },
          {
            id: "young-m2-l4",
            title: "R – Reliable Information",
            videoUrl: "https://www.youtube.com/embed/MHvY1RfRJSY",
            videoCredit: "Childnet International",
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
              {
                question: "How can you check if something online is true?",
                options: [
                  { label: "Ask a trusted adult", emoji: "👩‍🏫" },
                  { label: "Believe it because it looks real", emoji: "😮" },
                ],
                correctIndex: 0,
                explanation: "Asking a trusted adult is a great way to check if information is reliable!",
              },
            ],
            parentTip: "Help your child understand that anyone can put information online. Practice checking facts together using trusted sources.",
          },
          {
            id: "young-m2-l5",
            title: "T – Tell an Adult",
            videoUrl: "https://www.youtube.com/embed/6RRyVPmtL9I",
            videoCredit: "Childnet International",
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
              {
                question: "Who is a trusted adult you can tell?",
                options: [
                  { label: "A parent or teacher", emoji: "👨‍👩‍👧" },
                  { label: "A stranger online", emoji: "👤" },
                ],
                correctIndex: 0,
                explanation: "Parents, teachers, and family members are trusted adults you can talk to!",
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
        icon: "heart",
        color: "secondary",
        lessons: [
          {
            id: "young-m3-l1",
            title: "Kindness on the Internet",
            videoUrl: "https://www.youtube.com/embed/PGSCnMx0gLo",
            videoCredit: "BrainPOP",
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
          {
            id: "young-m3-l2",
            title: "What is Cyberbullying?",
            videoUrl: "https://www.youtube.com/embed/vtfMzmkYp9E",
            videoCredit: "Smile and Learn",
            narrationText: "Cyberbullying is when someone uses the internet to be mean, call names, or make fun of others. It hurts just as much as bullying in person, and it's never okay!",
            explanationText: "Cyberbullying can be sending mean messages, posting embarrassing photos, or leaving someone out of a group on purpose. If someone is being mean to you online, it's NOT your fault. Tell a grown-up right away!",
            quiz: [
              {
                question: "What is cyberbullying?",
                options: [
                  { label: "Playing games online", emoji: "🎮" },
                  { label: "Being mean to someone using technology", emoji: "😢" },
                  { label: "Watching videos", emoji: "📺" },
                ],
                correctIndex: 1,
                explanation: "Cyberbullying is using technology to be mean to others. It's never okay!",
              },
              {
                question: "If someone is cyberbullying you, is it your fault?",
                options: [
                  { label: "Yes", emoji: "😔" },
                  { label: "No, never!", emoji: "💪" },
                ],
                correctIndex: 1,
                explanation: "Cyberbullying is NEVER your fault! Tell a trusted adult and they'll help.",
              },
            ],
            parentTip: "Help your child understand that bullying can happen online too. Ensure they know they can always come to you without fear of losing their devices.",
          },
          {
            id: "young-m3-l3",
            title: "Being a Good Digital Friend",
            videoUrl: "https://www.youtube.com/embed/BZhpJBsoL3I",
            videoCredit: "Google for Education",
            narrationText: "Just like in real life, being a good friend online means being kind, including everyone, and standing up for others when you see someone being mean!",
            explanationText: "A good digital friend shares kind messages, includes others in games and chats, and speaks up if they see someone being bullied. You have the power to make the internet a nicer place!",
            quiz: [
              {
                question: "What makes a good digital friend?",
                options: [
                  { label: "Sharing mean jokes about others", emoji: "😈" },
                  { label: "Being kind and including everyone", emoji: "🤗" },
                  { label: "Ignoring everyone", emoji: "🙈" },
                ],
                correctIndex: 1,
                explanation: "Good digital friends are kind and make sure everyone feels included!",
              },
              {
                question: "You see someone being mean in a group chat. What do you do?",
                options: [
                  { label: "Join in – it's just for fun!", emoji: "😂" },
                  { label: "Stand up for the person and tell an adult", emoji: "🦸" },
                ],
                correctIndex: 1,
                explanation: "Be brave! Stand up for others and tell a trusted adult what's happening.",
              },
            ],
            parentTip: "Talk about what it means to be an 'upstander' vs a 'bystander'. Encourage your child to speak up when they see unkindness online.",
          },
          {
            id: "young-m3-l4",
            title: "Think Before You Post!",
            videoUrl: "https://www.youtube.com/embed/NI5bMnecv0M",
            videoCredit: "Common Sense Education",
            narrationText: "Once you put something online, it can stay there forever! Before you post a message, photo, or comment, stop and think – is it true? Is it helpful? Is it kind?",
            explanationText: "The internet has a long memory! Photos, messages, and comments can be saved, shared, and seen by lots of people. Before posting anything, use the THINK test: Is it True? Is it Helpful? Is it Inspiring? Is it Necessary? Is it Kind?",
            quiz: [
              {
                question: "Can you delete something from the internet completely?",
                options: [
                  { label: "Yes, just press delete!", emoji: "🗑️" },
                  { label: "Not always – someone might have saved it", emoji: "📸" },
                ],
                correctIndex: 1,
                explanation: "Once something is online, someone might have already saved or shared it. Think before you post!",
              },
              {
                question: "Before posting, you should ask yourself...",
                options: [
                  { label: "\"Will this get lots of likes?\"", emoji: "❤️" },
                  { label: "\"Is it true, helpful, and kind?\"", emoji: "🤔" },
                ],
                correctIndex: 1,
                explanation: "Always ask if your post is true, helpful, and kind before sharing it!",
              },
            ],
            parentTip: "Teach the THINK acronym: True, Helpful, Inspiring, Necessary, Kind. Practice applying it to everyday situations, both online and offline.",
          },
          {
            id: "young-m3-l5",
            title: "Dealing with Mean Messages",
            videoUrl: "https://www.youtube.com/embed/mgMkPIRGLcI",
            videoCredit: "Childnet International",
            narrationText: "Sometimes people send mean messages online. It can make you feel sad or angry. But remember – don't reply to mean messages! Save them, block the person, and tell a grown-up.",
            explanationText: "If someone sends you a mean message: 1) Don't reply – that's what they want! 2) Take a screenshot to save it. 3) Block the person so they can't message you again. 4) Tell a parent or teacher. You are NOT alone!",
            quiz: [
              {
                question: "Someone sends you a mean message. What's the FIRST thing you do?",
                options: [
                  { label: "Send a mean message back", emoji: "😤" },
                  { label: "Don't reply – save it and tell an adult", emoji: "📸" },
                  { label: "Delete it and pretend it didn't happen", emoji: "🙈" },
                ],
                correctIndex: 1,
                explanation: "Don't reply! Save the message as evidence and tell a trusted adult right away.",
              },
              {
                question: "Is it okay to feel sad about mean messages?",
                options: [
                  { label: "Yes, your feelings are valid!", emoji: "💛" },
                  { label: "No, just ignore it", emoji: "🤷" },
                ],
                correctIndex: 0,
                explanation: "Your feelings are completely valid! It's okay to feel sad, and it's important to talk about it with someone you trust.",
              },
            ],
            parentTip: "Validate your child's feelings if they receive mean messages. Help them practice the steps: don't reply, screenshot, block, and tell an adult.",
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
        icon: "shield",
        color: "primary",
        lessons: [
          {
            id: "teen-m1-l1",
            title: "What is the Internet?",
            videoUrl: "https://www.youtube.com/embed/gVoHRKIIFGg",
            videoCredit: "Childnet International",
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
          {
            id: "teen-m1-l2",
            title: "Your Digital Footprint",
            videoUrl: "https://www.youtube.com/embed/4P_gvJ1jXMc",
            videoCredit: "Common Sense Education",
            narrationText: "Every time you go online, you leave a trail called a digital footprint. Posts, comments, photos, likes – they all build up a picture of who you are. Future schools and employers might see it!",
            explanationText: "Your digital footprint is the record of everything you do online. It includes posts, comments, searches, and even things others share about you. It can be hard to erase, so think carefully about what you put out there.",
            quiz: [
              {
                question: "What is a digital footprint?",
                options: [
                  { label: "A footprint made by a robot", emoji: "🤖" },
                  { label: "The trail of information you leave online", emoji: "👣" },
                  { label: "A type of computer virus", emoji: "🦠" },
                ],
                correctIndex: 1,
                explanation: "Your digital footprint is the trail of everything you do, say, and share online!",
              },
              {
                question: "Can your digital footprint affect your future?",
                options: [
                  { label: "No, the internet forgets everything", emoji: "🤷" },
                  { label: "Yes, schools and employers can see it", emoji: "🔍" },
                ],
                correctIndex: 1,
                explanation: "Your digital footprint can be seen by future schools, universities, and employers. Keep it positive!",
              },
            ],
            parentTip: "Google your child's name together and discuss what comes up. Help them understand that their online actions create a lasting record.",
          },
          {
            id: "teen-m1-l3",
            title: "Online vs Offline – Knowing the Difference",
            videoUrl: "https://www.youtube.com/embed/fBJsMRSrml4",
            videoCredit: "BBC Own It",
            narrationText: "The online world can feel very different from real life. People might act differently behind a screen. Remember that real people with real feelings are behind every profile!",
            explanationText: "Online communication removes body language and tone of voice, making it easy to misunderstand each other. People sometimes say things online they'd never say in person. Always remember there's a real person reading your messages.",
            quiz: [
              {
                question: "Why do some people act differently online?",
                options: [
                  { label: "They feel hidden behind a screen", emoji: "🖥️" },
                  { label: "The internet makes people nicer", emoji: "😊" },
                  { label: "They have different personalities online", emoji: "🎭" },
                ],
                correctIndex: 0,
                explanation: "Feeling anonymous behind a screen can make people act differently. But real people are still affected by your words!",
              },
              {
                question: "When messaging someone, you should remember that...",
                options: [
                  { label: "It's just the internet, nothing matters", emoji: "🤷" },
                  { label: "There's a real person with real feelings reading it", emoji: "💛" },
                ],
                correctIndex: 1,
                explanation: "Always remember there's a real person behind every screen! Treat them with respect.",
              },
            ],
            parentTip: "Discuss how online communication differs from face-to-face conversations. Talk about how texts and messages can be misinterpreted without tone of voice.",
          },
          {
            id: "teen-m1-l4",
            title: "Screen Time and Wellbeing",
            videoUrl: "https://www.youtube.com/embed/jo_B4LTHi3I",
            videoCredit: "BBC Own It",
            narrationText: "Too much screen time can affect your sleep, mood, and even your friendships. Learning to balance your online and offline life is a superpower!",
            explanationText: "Research shows that excessive screen time can lead to poor sleep, anxiety, and reduced physical activity. Set boundaries: no devices at bedtime, take regular breaks, and make time for offline hobbies and face-to-face friendships.",
            quiz: [
              {
                question: "How can too much screen time affect you?",
                options: [
                  { label: "It can disrupt your sleep and mood", emoji: "😴" },
                  { label: "It makes you smarter", emoji: "🧠" },
                  { label: "It has no effect", emoji: "🤷" },
                ],
                correctIndex: 0,
                explanation: "Too much screen time can affect your sleep, mood, and physical health. Balance is key!",
              },
              {
                question: "What's a good habit for screen time?",
                options: [
                  { label: "Use screens right before bed", emoji: "🌙" },
                  { label: "Take regular breaks and set time limits", emoji: "⏰" },
                ],
                correctIndex: 1,
                explanation: "Taking regular breaks and setting time limits helps you maintain a healthy balance!",
              },
            ],
            parentTip: "Create a family media plan together. Agree on screen-free zones (like bedrooms) and screen-free times (like meals). Lead by example with your own device usage.",
          },
          {
            id: "teen-m1-l5",
            title: "Your Rights Online",
            videoUrl: "https://www.youtube.com/embed/V9_PjdU3Mpo",
            videoCredit: "UNICEF",
            narrationText: "You have rights online, just like offline! You have the right to be safe, to privacy, and to access information. You also have the right to say no and to get help if something goes wrong.",
            explanationText: "The UN Convention on the Rights of the Child applies online too! You have the right to: be safe from harm, keep your information private, access age-appropriate content, express your opinions, and get help when you need it. Knowing your rights empowers you!",
            quiz: [
              {
                question: "Do children have rights online?",
                options: [
                  { label: "No, only adults have online rights", emoji: "👤" },
                  { label: "Yes, children have rights online too!", emoji: "✊" },
                ],
                correctIndex: 1,
                explanation: "Absolutely! Children have rights online including safety, privacy, and access to help.",
              },
              {
                question: "Which of these is one of your online rights?",
                options: [
                  { label: "The right to bully others anonymously", emoji: "😡" },
                  { label: "The right to be safe and get help", emoji: "🛡️" },
                  { label: "The right to use any app with no rules", emoji: "📱" },
                ],
                correctIndex: 1,
                explanation: "You have the right to be safe online and to get help whenever you need it!",
              },
            ],
            parentTip: "Discuss your child's online rights with them. Emphasise that having rights also means having responsibilities – like treating others with respect.",
          },
        ],
      },
      {
        id: "teen-m2",
        title: "Privacy & Passwords",
        emoji: "🔐",
        icon: "lock",
        color: "secondary",
        lessons: [
          {
            id: "teen-m2-l1",
            title: "Creating Strong Passwords",
            videoUrl: "https://www.youtube.com/embed/aEmF3Iylvr4",
            videoCredit: "Google for Education",
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
          {
            id: "teen-m2-l2",
            title: "What is Personal Information?",
            videoUrl: "https://www.youtube.com/embed/yiKeLOKc1tw",
            videoCredit: "Common Sense Education",
            narrationText: "Personal information is any data that can identify you – your full name, address, phone number, school, birthday, and even photos. Protecting it keeps you safe online!",
            explanationText: "Personal information includes: your full name, home address, phone number, email, school name, birthday, photos, and location data. Sharing too much can put you at risk. Only share personal info with people and websites you trust.",
            quiz: [
              {
                question: "Which of these is personal information?",
                options: [
                  { label: "Your favourite colour", emoji: "🎨" },
                  { label: "Your home address", emoji: "📍" },
                  { label: "Your favourite game", emoji: "🎮" },
                ],
                correctIndex: 1,
                explanation: "Your home address is personal information that could help someone find you. Keep it private!",
              },
              {
                question: "Is your birthday considered personal information?",
                options: [
                  { label: "No, everyone has birthdays!", emoji: "🎂" },
                  { label: "Yes, it can be used to identify you", emoji: "🔐" },
                ],
                correctIndex: 1,
                explanation: "Your birthday is personal information! Combined with other details, it can be used to steal your identity.",
              },
            ],
            parentTip: "Help your child identify all types of personal information. Discuss which forms and websites are safe to share information with, and which aren't.",
          },
          {
            id: "teen-m2-l3",
            title: "Two-Factor Authentication",
            videoUrl: "https://www.youtube.com/embed/hGRii5f_uSc",
            videoCredit: "Google",
            narrationText: "Two-factor authentication adds an extra lock to your accounts. Even if someone guesses your password, they still can't get in without the second step!",
            explanationText: "Two-factor authentication (2FA) requires two things to log in: something you know (password) and something you have (like a code sent to your phone). It's like having two locks on your door instead of one!",
            quiz: [
              {
                question: "What does two-factor authentication do?",
                options: [
                  { label: "Makes your password shorter", emoji: "✂️" },
                  { label: "Adds an extra layer of security", emoji: "🔐" },
                  { label: "Removes the need for passwords", emoji: "🚫" },
                ],
                correctIndex: 1,
                explanation: "2FA adds an extra security layer so even if someone knows your password, they can't get into your account!",
              },
              {
                question: "Is two-factor authentication worth the extra step?",
                options: [
                  { label: "No, it's too annoying", emoji: "😤" },
                  { label: "Yes, it keeps your accounts much safer!", emoji: "🛡️" },
                ],
                correctIndex: 1,
                explanation: "The extra few seconds are totally worth it for keeping your accounts secure!",
              },
            ],
            parentTip: "Help your child set up 2FA on their important accounts. Use this as an opportunity to discuss why account security matters.",
          },
          {
            id: "teen-m2-l4",
            title: "Privacy Settings on Apps",
            videoUrl: "https://www.youtube.com/embed/dbqBqzCYxnY",
            videoCredit: "Internet Matters",
            narrationText: "Every app and social media platform has privacy settings. Taking a few minutes to adjust them can make a huge difference in who sees your information!",
            explanationText: "Most apps collect data about you by default. Check your privacy settings to control: who can see your posts, who can message you, whether your location is shared, and what data apps can access. Review these settings regularly!",
            quiz: [
              {
                question: "Why should you check your privacy settings?",
                options: [
                  { label: "To get more followers", emoji: "📈" },
                  { label: "To control who sees your information", emoji: "🔒" },
                  { label: "Privacy settings don't matter", emoji: "🤷" },
                ],
                correctIndex: 1,
                explanation: "Privacy settings let you control who can see your posts, message you, and access your data!",
              },
              {
                question: "How often should you review your privacy settings?",
                options: [
                  { label: "Once when you first join, then never", emoji: "📅" },
                  { label: "Regularly, as apps update their settings", emoji: "🔄" },
                ],
                correctIndex: 1,
                explanation: "Apps frequently update their settings, so review them regularly to stay protected!",
              },
            ],
            parentTip: "Sit with your child and go through privacy settings on each of their apps together. Make it a regular activity, especially after app updates.",
          },
          {
            id: "teen-m2-l5",
            title: "Cookies and Tracking",
            videoUrl: "https://www.youtube.com/embed/GURxbEhMZBw",
            videoCredit: "TED-Ed",
            narrationText: "Have you noticed websites asking about cookies? Not the chocolate kind! Digital cookies track what you do online. Understanding them helps you protect your privacy.",
            explanationText: "Website cookies are small files that remember your preferences and track your browsing. Some are useful (keeping you logged in), but others track you across the internet to show targeted ads. You can manage cookies in your browser settings.",
            quiz: [
              {
                question: "What are digital cookies?",
                options: [
                  { label: "Snacks for your computer", emoji: "🍪" },
                  { label: "Files that track your browsing activity", emoji: "📊" },
                  { label: "A type of virus", emoji: "🦠" },
                ],
                correctIndex: 1,
                explanation: "Digital cookies are small files websites use to remember you and track your activity online.",
              },
              {
                question: "Are all cookies bad?",
                options: [
                  { label: "Yes, block them all!", emoji: "🚫" },
                  { label: "No, some are useful but others track you", emoji: "⚖️" },
                ],
                correctIndex: 1,
                explanation: "Some cookies are helpful (like keeping you logged in), but tracking cookies follow you across the web. You can manage which ones to allow!",
              },
            ],
            parentTip: "Show your child how to manage cookie settings in their browser. Discuss why some websites need cookies and why it's good to reject unnecessary tracking.",
          },
        ],
      },
      {
        id: "teen-m3",
        title: "Protect Your Profile",
        emoji: "👤",
        icon: "eye",
        color: "accent",
        lessons: [
          {
            id: "teen-m3-l1",
            title: "5 Ways to Stay Private Online",
            videoUrl: "https://www.youtube.com/embed/HxySrSbSY7o",
            videoCredit: "National Crime Agency (CEOP)",
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
                  { label: "Your favourite movie", emoji: "🎬" },
                  { label: "Your current location", emoji: "📍" },
                  { label: "A book you liked", emoji: "📖" },
                ],
                correctIndex: 1,
                explanation: "Never share your current location online — it tells strangers where to find you!",
              },
            ],
            parentTip: "Sit with your child and review the privacy settings on their apps and social media accounts together. Make it a regular activity.",
          },
          {
            id: "teen-m3-l2",
            title: "Sharing Photos Safely",
            videoUrl: "https://www.youtube.com/embed/4Gxhjdlkadg",
            videoCredit: "Childnet International",
            narrationText: "Photos can reveal more than you think! Location data, school uniforms, street signs – all these details in the background can give away where you are.",
            explanationText: "Before sharing a photo: 1) Check the background for identifying details. 2) Make sure everyone in the photo is happy for it to be shared. 3) Turn off location tags on your camera. 4) Never share photos you might regret later.",
            quiz: [
              {
                question: "What hidden info can photos contain?",
                options: [
                  { label: "Your favourite food", emoji: "🍕" },
                  { label: "Location data showing where you are", emoji: "📍" },
                  { label: "Your homework answers", emoji: "📝" },
                ],
                correctIndex: 1,
                explanation: "Photos can contain hidden location data (metadata) that reveals exactly where you were when you took them!",
              },
              {
                question: "Should you share photos of friends without asking?",
                options: [
                  { label: "Yes, they'll be happy!", emoji: "😄" },
                  { label: "No, always ask first!", emoji: "🙋" },
                ],
                correctIndex: 1,
                explanation: "Always ask permission before sharing someone else's photo! Respect their privacy.",
              },
            ],
            parentTip: "Show your child how to check and disable location data on their phone's camera. Discuss what background details in photos could reveal.",
          },
          {
            id: "teen-m3-l3",
            title: "Managing Your Online Reputation",
            videoUrl: "https://www.youtube.com/embed/wWClBERMN14",
            videoCredit: "Common Sense Education",
            narrationText: "Your online reputation is what people think of you based on what they see online. It's like a first impression that lasts forever! Keep it positive by being thoughtful about what you share.",
            explanationText: "Everything you post contributes to your online reputation. Universities and future employers often check social media. Keep your accounts positive and professional. Remember: it's easier to maintain a good reputation than to fix a bad one!",
            quiz: [
              {
                question: "Who might check your social media in the future?",
                options: [
                  { label: "Nobody will ever look", emoji: "🙈" },
                  { label: "Universities and employers", emoji: "🏫" },
                  { label: "Only your friends", emoji: "👫" },
                ],
                correctIndex: 1,
                explanation: "Universities and future employers often look at applicants' social media! Keep yours positive.",
              },
              {
                question: "How can you maintain a good online reputation?",
                options: [
                  { label: "Post everything without thinking", emoji: "📱" },
                  { label: "Be thoughtful and positive about what you share", emoji: "✨" },
                ],
                correctIndex: 1,
                explanation: "Being thoughtful about what you post helps build a positive online reputation that serves you well in the future!",
              },
            ],
            parentTip: "Have your child search for themselves online. Discuss what a future school or employer would think based on what they find. Help them curate a positive online presence.",
          },
          {
            id: "teen-m3-l4",
            title: "Catfishing and Fake Profiles",
            videoUrl: "https://www.youtube.com/embed/qDjQ2PZRxRo",
            videoCredit: "CEOP Education",
            narrationText: "Not everyone online is who they claim to be. Catfishing is when someone creates a fake profile to trick others. Learn to spot the warning signs!",
            explanationText: "Catfishing is when someone uses fake photos and information to pretend to be someone else online. Warning signs include: refusing to video call, having very few posts or friends, having only perfect-looking photos, and asking too many personal questions.",
            quiz: [
              {
                question: "What is catfishing?",
                options: [
                  { label: "A type of fishing game", emoji: "🐟" },
                  { label: "Pretending to be someone else online", emoji: "🎭" },
                  { label: "A social media trend", emoji: "📱" },
                ],
                correctIndex: 1,
                explanation: "Catfishing is when someone creates a fake identity online to deceive others. Always be cautious!",
              },
              {
                question: "Which is a warning sign of a fake profile?",
                options: [
                  { label: "They have lots of real friends", emoji: "👫" },
                  { label: "They refuse to video call and ask lots of personal questions", emoji: "🚩" },
                ],
                correctIndex: 1,
                explanation: "If someone won't video call and keeps asking personal questions, they might not be who they say they are!",
              },
            ],
            parentTip: "Discuss catfishing with your child and how to verify someone's identity online. Establish rules about online friendships and who they can communicate with.",
          },
          {
            id: "teen-m3-l5",
            title: "Location Sharing – Hidden Dangers",
            videoUrl: "https://www.youtube.com/embed/0j21nNNpXJU",
            videoCredit: "Internet Matters",
            narrationText: "Many apps track and share your location without you realising. This can tell strangers exactly where you are – at school, at home, or hanging out with friends!",
            explanationText: "Location sharing can happen through: geotagged photos, social media check-ins, app permissions, and even Wi-Fi connections. Turn off location services for apps that don't need it. Never post in real-time where you are – wait until you've left!",
            quiz: [
              {
                question: "When is it safe to share your location on social media?",
                options: [
                  { label: "Right now, so friends can find me!", emoji: "📍" },
                  { label: "After you've already left that place", emoji: "🕐" },
                  { label: "Always – it's no big deal", emoji: "🤷" },
                ],
                correctIndex: 1,
                explanation: "If you want to share a location, wait until you've already left! Posting in real-time tells strangers exactly where you are.",
              },
              {
                question: "Which apps might share your location?",
                options: [
                  { label: "Only maps apps", emoji: "🗺️" },
                  { label: "Many apps, including social media and games", emoji: "📱" },
                ],
                correctIndex: 1,
                explanation: "Many apps request location access! Check your phone's settings to see which apps have location permission.",
              },
            ],
            parentTip: "Review which apps have location access on your child's device. Discuss why real-time location sharing is risky and set clear rules about it.",
          },
        ],
      },
      {
        id: "teen-m4",
        title: "Cyberbullying & Respect",
        emoji: "🤝",
        icon: "heart",
        color: "accent",
        lessons: [
          {
            id: "teen-m4-l1",
            title: "Standing Up to Cyberbullying",
            videoUrl: "https://www.youtube.com/embed/Jwu_7IqWh8Y",
            videoCredit: "Childnet International",
            narrationText: "Cyberbullying is when someone uses technology to hurt, embarrass, or threaten others. If it happens to you, don't respond — save the evidence and tell a trusted adult.",
            explanationText: "Cyberbullying includes mean messages, sharing embarrassing photos, excluding someone on purpose, or spreading rumours online. It's never okay, and it's not your fault. Always report it!",
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
          {
            id: "teen-m4-l2",
            title: "Being an Upstander, Not a Bystander",
            videoUrl: "https://www.youtube.com/embed/lPBfsWv_9xc",
            videoCredit: "Common Sense Education",
            narrationText: "When you see someone being bullied online, you have a choice: be a bystander and watch, or be an upstander and help. Standing up for others takes courage, but it makes a real difference!",
            explanationText: "An upstander is someone who supports a person being bullied. You can: send a kind message to the victim, report the bully, don't share or like mean content, and tell a trusted adult. Even small actions can have a big impact!",
            quiz: [
              {
                question: "What's the difference between a bystander and an upstander?",
                options: [
                  { label: "A bystander watches, an upstander helps", emoji: "🦸" },
                  { label: "They're the same thing", emoji: "🤷" },
                  { label: "A bystander helps, an upstander watches", emoji: "👀" },
                ],
                correctIndex: 0,
                explanation: "An upstander takes action to help – a bystander just watches. Be an upstander!",
              },
              {
                question: "How can you be an upstander online?",
                options: [
                  { label: "Like and share the mean post", emoji: "👍" },
                  { label: "Send a supportive message to the victim and report the bully", emoji: "💛" },
                ],
                correctIndex: 1,
                explanation: "Support the victim with kind words and report the bullying. Your actions matter!",
              },
            ],
            parentTip: "Discuss the concept of being an upstander with your child. Role-play different scenarios so they feel confident standing up for others online.",
          },
          {
            id: "teen-m4-l3",
            title: "The Impact of Words Online",
            videoUrl: "https://www.youtube.com/embed/niRT0rlFOeE",
            videoCredit: "Childnet International",
            narrationText: "Words online can hurt just as much as words in person – sometimes even more, because they stay there forever. Think before you type, and always choose kindness!",
            explanationText: "Online messages lack tone of voice and facial expressions, so they can be easily misunderstood. What you think is a joke might really hurt someone. Remember: once it's posted, you can't take it back. Use emojis to show tone, and when in doubt, be kind!",
            quiz: [
              {
                question: "Why can words online hurt even more than in person?",
                options: [
                  { label: "They can't – online words don't matter", emoji: "🤷" },
                  { label: "They stay forever and can be seen by many people", emoji: "📢" },
                ],
                correctIndex: 1,
                explanation: "Online words can be screenshot, shared, and stay visible forever. That's why they can hurt even more!",
              },
              {
                question: "Your friend seems upset by a message you sent. What do you do?",
                options: [
                  { label: "Say \"it was just a joke, relax!\"", emoji: "😒" },
                  { label: "Apologise and ask how they feel", emoji: "💛" },
                ],
                correctIndex: 1,
                explanation: "If someone's feelings are hurt, apologise sincerely. Their feelings are valid even if you didn't mean to upset them.",
              },
            ],
            parentTip: "Discuss how messages can be misinterpreted online. Encourage your child to re-read messages before sending and to consider how the recipient might feel.",
          },
          {
            id: "teen-m4-l4",
            title: "How to Block and Report",
            videoUrl: "https://www.youtube.com/embed/K6CrfMOP0ds",
            videoCredit: "Internet Matters",
            narrationText: "Every social media app and game has tools to block and report people who are being harmful. Learning how to use these tools is an important skill for staying safe!",
            explanationText: "Blocking someone stops them from seeing your profile and contacting you. Reporting tells the platform that someone is breaking the rules. You should block AND report: don't just block, as reporting helps protect others too!",
            quiz: [
              {
                question: "What does blocking someone do?",
                options: [
                  { label: "Deletes their account", emoji: "🗑️" },
                  { label: "Stops them from seeing your profile and contacting you", emoji: "🚫" },
                  { label: "Sends them a warning", emoji: "⚠️" },
                ],
                correctIndex: 1,
                explanation: "Blocking prevents that person from viewing your profile and sending you messages!",
              },
              {
                question: "Should you report someone even if you've already blocked them?",
                options: [
                  { label: "No, blocking is enough", emoji: "✋" },
                  { label: "Yes, reporting helps protect others too", emoji: "🛡️" },
                ],
                correctIndex: 1,
                explanation: "Always report harmful behaviour! It helps the platform take action and protects other users too.",
              },
            ],
            parentTip: "Walk through the blocking and reporting process on each app your child uses. Make sure they feel confident doing it independently if needed.",
          },
          {
            id: "teen-m4-l5",
            title: "Building a Positive Online Community",
            videoUrl: "https://www.youtube.com/embed/PUl7m0cHBpg",
            videoCredit: "Google for Education",
            narrationText: "The internet can be an amazing, positive place when we all do our part! By being kind, respectful, and inclusive, you help build a community where everyone feels welcome.",
            explanationText: "You have the power to shape your online community! Share positive content, celebrate others' achievements, include everyone, and stand up against negativity. Remember: every kind comment, supportive message, and positive post makes the internet better for everyone!",
            quiz: [
              {
                question: "How can YOU make the internet a better place?",
                options: [
                  { label: "By only posting negative comments", emoji: "👎" },
                  { label: "By being kind, inclusive, and supportive", emoji: "🌟" },
                  { label: "By never going online", emoji: "🚫" },
                ],
                correctIndex: 1,
                explanation: "Being kind, inclusive, and supportive online makes the internet better for everyone!",
              },
              {
                question: "Which action builds a positive online community?",
                options: [
                  { label: "Celebrating someone's achievement", emoji: "🎉" },
                  { label: "Leaving rude comments on posts", emoji: "😡" },
                ],
                correctIndex: 0,
                explanation: "Celebrating others' achievements and being supportive builds a positive, welcoming online community!",
              },
            ],
            parentTip: "Encourage your child to be a positive force online. Praise them when they show kindness and empathy in their online interactions.",
          },
        ],
      },
      {
        id: "teen-m5",
        title: "Scams & Phishing",
        emoji: "🎣",
        icon: "warning",
        color: "secondary",
        lessons: [
          {
            id: "teen-m5-l1",
            title: "Spotting Scams Online",
            videoUrl: "https://www.youtube.com/embed/XCF_wMBqXuY",
            videoCredit: "Google for Education",
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
          {
            id: "teen-m5-l2",
            title: "Fake Websites – How to Tell",
            videoUrl: "https://www.youtube.com/embed/KjnPprhyRjU",
            videoCredit: "National Cyber Security Centre",
            narrationText: "Scammers create fake websites that look almost identical to real ones. They want you to enter your login details or payment information. Learning to spot fakes protects you!",
            explanationText: "Check for: 1) The padlock icon in the address bar. 2) The correct URL spelling (g00gle vs google). 3) Poor design or spelling errors. 4) Unrealistic offers. When in doubt, type the website address directly instead of clicking links.",
            quiz: [
              {
                question: "How can you tell if a website might be fake?",
                options: [
                  { label: "It looks exactly like the real site", emoji: "👍" },
                  { label: "The URL has strange spelling or extra characters", emoji: "🔍" },
                  { label: "It loads quickly", emoji: "⚡" },
                ],
                correctIndex: 1,
                explanation: "Fake websites often have slightly misspelled URLs or unusual characters. Always check the address bar!",
              },
              {
                question: "You find a website offering free game codes. What do you do?",
                options: [
                  { label: "Enter your details immediately!", emoji: "🎮" },
                  { label: "Be suspicious – it could be a scam", emoji: "🤔" },
                ],
                correctIndex: 1,
                explanation: "Free offers online are often scams designed to steal your information. If it seems too good to be true, it probably is!",
              },
            ],
            parentTip: "Practice identifying fake websites together. Show your child how to check URLs and look for the padlock icon in the browser.",
          },
          {
            id: "teen-m5-l3",
            title: "Social Media Scams",
            videoUrl: "https://www.youtube.com/embed/KDojDx9oky0",
            videoCredit: "Internet Matters",
            narrationText: "Scammers love social media! They create fake competitions, impersonate celebrities, and send messages with dodgy links. Knowing the tricks helps you avoid getting caught!",
            explanationText: "Common social media scams include: fake giveaways asking you to share personal info, fake celebrity accounts, 'click to see who viewed your profile' links, and messages from hacked friend accounts. If something seems off, trust your instinct!",
            quiz: [
              {
                question: "A celebrity DMs you saying you've won a prize. This is probably...",
                options: [
                  { label: "Amazing – I'm so lucky!", emoji: "🤩" },
                  { label: "A scam – celebrities don't DM random people", emoji: "🚩" },
                ],
                correctIndex: 1,
                explanation: "Real celebrities don't randomly DM people about prizes. This is a common social media scam!",
              },
              {
                question: "Your friend sends a weird link that doesn't seem like them. What happened?",
                options: [
                  { label: "They found something cool!", emoji: "😎" },
                  { label: "Their account might have been hacked", emoji: "🔓" },
                ],
                correctIndex: 1,
                explanation: "If a friend sends unusual messages or links, their account may have been hacked. Contact them another way to check!",
              },
            ],
            parentTip: "Discuss common social media scams with your child. Teach them to be sceptical of unsolicited messages and too-good-to-be-true offers.",
          },
          {
            id: "teen-m5-l4",
            title: "In-Game Scams",
            videoUrl: "https://www.youtube.com/embed/nPrkqbhZxkc",
            videoCredit: "Internet Matters",
            narrationText: "Online games are full of scams too! People might offer free skins, coins, or upgrades in exchange for your login details. Don't fall for it – they just want to steal your account!",
            explanationText: "Common gaming scams include: fake 'free V-Bucks' generators, people offering to 'boost' your account (but stealing it), phishing links in game chats, and fake trading offers. Only use official stores for purchases and never share your login details!",
            quiz: [
              {
                question: "Someone offers free in-game currency if you give them your login. What do you do?",
                options: [
                  { label: "Give them your details – free stuff!", emoji: "🤑" },
                  { label: "Say no – this is a scam!", emoji: "🚫" },
                ],
                correctIndex: 1,
                explanation: "Never give your login details to anyone! Free currency offers are almost always scams designed to steal your account.",
              },
              {
                question: "Where should you buy in-game items?",
                options: [
                  { label: "From random websites offering deals", emoji: "🌐" },
                  { label: "Only from the official game store", emoji: "🏪" },
                ],
                correctIndex: 1,
                explanation: "Only buy from official game stores! Third-party sites can scam you or steal your information.",
              },
            ],
            parentTip: "Discuss gaming scams with your child, especially around popular games like Fortnite, Roblox, and Minecraft. Set rules about in-game purchases.",
          },
          {
            id: "teen-m5-l5",
            title: "What To Do If You Get Scammed",
            videoUrl: "https://www.youtube.com/embed/s7wmiS2mSXY",
            videoCredit: "BBC Bitesize",
            narrationText: "If you think you've been scammed, don't panic! There are steps you can take right away to protect yourself and prevent more damage.",
            explanationText: "If you've been scammed: 1) Tell a trusted adult immediately. 2) Change your passwords right away. 3) Don't reply to the scammer. 4) Report it to the platform. 5) If money was involved, contact the bank. Remember: it's not your fault, and getting help quickly is the best thing you can do!",
            quiz: [
              {
                question: "You accidentally clicked a scam link and entered your password. What's the FIRST thing you do?",
                options: [
                  { label: "Nothing – it's probably fine", emoji: "🤷" },
                  { label: "Tell an adult and change your password immediately", emoji: "🏃" },
                  { label: "Click the link again to check", emoji: "👆" },
                ],
                correctIndex: 1,
                explanation: "Act fast! Tell an adult and change your password immediately to protect your account.",
              },
              {
                question: "Is it embarrassing to admit you got scammed?",
                options: [
                  { label: "Yes, so keep it a secret", emoji: "🤫" },
                  { label: "No – scammers are very clever and it can happen to anyone", emoji: "💪" },
                ],
                correctIndex: 1,
                explanation: "Scammers are professionals at tricking people! It can happen to anyone. The important thing is to get help quickly.",
              },
            ],
            parentTip: "Make sure your child knows they won't be in trouble if they fall for a scam. Quick action is more important than blame. Discuss the steps to take together.",
          },
        ],
      },
    ],
  },
];

export const searchableTopics = [
  { keyword: "privacy", lessonIds: ["teen-m2-l1", "teen-m2-l2", "teen-m2-l4", "teen-m2-l5", "teen-m3-l1", "teen-m3-l2", "teen-m3-l5", "young-m2-l1"] },
  { keyword: "password", lessonIds: ["teen-m2-l1", "teen-m2-l3"] },
  { keyword: "bullying", lessonIds: ["teen-m4-l1", "teen-m4-l2", "teen-m4-l3", "young-m3-l2", "young-m3-l5"] },
  { keyword: "cyberbullying", lessonIds: ["teen-m4-l1", "teen-m4-l2", "teen-m4-l3", "teen-m4-l4", "young-m3-l2", "young-m3-l5"] },
  { keyword: "safe", lessonIds: ["young-m2-l1", "young-m2-l5", "teen-m1-l1", "teen-m1-l5"] },
  { keyword: "kind", lessonIds: ["young-m3-l1", "young-m3-l3", "teen-m4-l5"] },
  { keyword: "scam", lessonIds: ["teen-m5-l1", "teen-m5-l2", "teen-m5-l3", "teen-m5-l4", "teen-m5-l5"] },
  { keyword: "phishing", lessonIds: ["teen-m5-l1", "teen-m5-l2"] },
  { keyword: "stranger", lessonIds: ["young-m2-l1", "young-m2-l2", "teen-m3-l4"] },
  { keyword: "meeting", lessonIds: ["young-m2-l2"] },
  { keyword: "profile", lessonIds: ["teen-m3-l1", "teen-m3-l3", "teen-m3-l4"] },
  { keyword: "internet", lessonIds: ["young-m1-l1", "young-m1-l2", "young-m1-l3", "teen-m1-l1", "teen-m1-l3"] },
  { keyword: "trust", lessonIds: ["young-m2-l4", "teen-m1-l1"] },
  { keyword: "reliable", lessonIds: ["young-m2-l4"] },
  { keyword: "posts", lessonIds: ["teen-m3-l1", "teen-m3-l3", "young-m3-l1", "young-m3-l4"] },
  { keyword: "links", lessonIds: ["young-m2-l3", "teen-m5-l1", "teen-m5-l2", "teen-m5-l3"] },
  { keyword: "photos", lessonIds: ["teen-m3-l1", "teen-m3-l2", "young-m3-l4"] },
  { keyword: "digital footprint", lessonIds: ["teen-m1-l2", "teen-m3-l3"] },
  { keyword: "screen time", lessonIds: ["young-m1-l5", "teen-m1-l4"] },
  { keyword: "cookies", lessonIds: ["teen-m2-l5"] },
  { keyword: "location", lessonIds: ["teen-m3-l5", "teen-m3-l2"] },
  { keyword: "blocking", lessonIds: ["teen-m4-l4"] },
  { keyword: "reporting", lessonIds: ["teen-m4-l4"] },
  { keyword: "gaming", lessonIds: ["teen-m5-l4"] },
  { keyword: "catfishing", lessonIds: ["teen-m3-l4"] },
  { keyword: "reputation", lessonIds: ["teen-m3-l3", "teen-m1-l2"] },
  { keyword: "rights", lessonIds: ["teen-m1-l5"] },
  { keyword: "apps", lessonIds: ["young-m1-l3", "teen-m2-l4"] },
  { keyword: "wellbeing", lessonIds: ["teen-m1-l4", "young-m1-l5"] },
  { keyword: "two factor", lessonIds: ["teen-m2-l3"] },
];
