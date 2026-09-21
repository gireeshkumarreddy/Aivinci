/**
 * Approved Aivinci content — every string on the site comes from the master
 * document or from the supplied Aivinci visuals. Nothing here is invented.
 */

export const brand = {
  name: 'Aivinci Creative Studio',
  nameA: 'Aivinci',
  nameB: 'Creative Studio',
  tagline: ['Ideas', 'People', 'Technology'],
  line: 'A brighter tomorrow.',
  keywords: ['Creative', 'Technology', 'People'],
  email: 'studio@aivinci.ai',
  /** studio phone number — displayed as soon as the client supplies it */
  phone: '',
  site: 'https://aivinci.ai',
  year: '2026',
  /** the studio's channels, as supplied by Aivinci */
  social: [
    { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/@aivincistudios' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/aivinci.ai' },
    { id: 'threads', label: 'Threads', href: 'https://www.threads.com/@aivinci.ai' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/aivinci.ai' },
  ] as const,
}

/** header, mobile menu and footer order (as requested by the client) */
export const nav = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'approach', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'products', label: 'Products' },
  { id: 'contact', label: 'Contact' },
] as const

export const cta = {
  startProject: 'Start a Project',
  startProjectLower: 'Start a project',
  watchStory: 'Watch Our Story',
  explore: 'Explore Aivinci',
  viewWork: 'View Work',
  viewAllWork: 'View All Work',
  exploreZynnect: 'Explore Zynnect',
  zynnectUrl: 'https://zynnect.com',
  startConversation: 'Start the Conversation',
  scrollToExplore: ['Scroll', 'to explore'],
}

export const hero = {
  label: 'AI Creative & Technology Studio',
  headline: ['We Create', 'What’s Next.'],
  body: 'We combine creativity, artificial intelligence and technology to create films, visual experiences, digital solutions and products.',
  handwriting: ['Hey! Welcome to Aivinci.', 'Ideas for a', 'brighter tomorrow.'],
  availability: ['We’re available', 'for you'],
  creativeTech: ['Creative', 'Technology'],
  featured: { label: 'Featured Work', title: 'The Next You', type: 'AI Film', year: '2026' },
  stats: [
    { value: '400+', label: 'Projects Delivered' },
    { value: '230+', label: 'Global Clients' },
  ],
  disciplines: ['AI Films', 'Brand', 'Digital', 'Products'],
}

export const servicesIntro = {
  label: '02 / Services',
  headline: ['Creative', 'Solutions', 'for a', 'Brighter', 'Tomorrow.'],
  support: 'From films and brand stories to AI solutions and digital products — we turn ideas into impact.',
  sideText: ['Got an idea?', 'Here’s what we can create.'],
  message: 'A full range of creative, content and technology services designed to help brands and businesses grow.',
  statement: ['Creative thinking.', 'Technology-driven.', 'Real impact.'],
  labelsA: ['Film', 'Brand', 'Content', 'Technology', 'Experiences', 'Products'],
  labelsB: ['Ideas', 'Stories', 'People', 'A brighter', 'tomorrow'],
  ideasIntoImpact: ['Ideas', 'into impact.'],
  cardText: ['AI', 'Creative', 'Technology', 'Stories'],
  giant: 'SERVICES',
}

export interface Service {
  n: string
  title: string[]
  body: string
  media: string
  caption: string[]
}

export const services: Service[] = [
  { n: '01', title: ['AI', 'Filmmaking'], body: 'AI films, commercials, music videos and more.', media: 'ai-filmmaking', caption: ['Cinematic', 'stories', 'reimagined.'] },
  { n: '02', title: ['Brand &', 'Commercial'], body: 'Brand films, product films, campaigns and more.', media: 'brand-commercial', caption: ['Brands', 'that', 'move people.'] },
  { n: '03', title: ['Social &', 'Digital'], body: 'Reels, short-form content, digital campaigns.', media: 'social-digital', caption: ['Short', 'ideas', 'big impact.'] },
  { n: '04', title: ['Creative', 'Technology'], body: 'AI solutions, workflows, prototyping and more.', media: 'creative-technology', caption: ['Ideas', 'meet', 'innovation.'] },
  { n: '05', title: ['Digital', 'Experiences'], body: 'Interactive websites, 3D experiences and more.', media: 'digital-experiences', caption: ['Immersive', 'experiences', 'real results.'] },
  { n: '06', title: ['Digital Product', 'Development'], body: 'From ideas to real products.', media: 'product-development', caption: ['Build', 'solve', 'scale.'] },
  { n: '07', title: ['VFX, Animation', '& Motion'], body: 'VFX, animation, motion graphics and more.', media: 'vfx-motion', caption: ['Worlds', 'beyond', 'reality.'] },
  { n: '08', title: ['Audio, Voice', '& Music'], body: 'Voiceovers, music, sound design and more.', media: 'audio-music', caption: ['Sound', 'that', 'stays.'] },
]

export const servicesGrid = {
  topLeft: ['Ideas', 'into impact.'],
  topCenter: hero.body,
  topRight: ['Services that', 'create what’s next.'],
  outro: { headline: ['Let’s Create', 'Together.'], body: ['Have a project in mind? Let’s turn ideas into impact.', 'We’d love to hear from you.'] },
  handwriting: ['Ideas for a', 'brighter tomorrow.'],
  outroLabels: ['Film', 'Brand', 'Technology', 'People'],
}

export const approach = {
  label: '03 / Our Approach',
  heading: 'Our Approach',
  keywords: ['Ideas', 'People', 'Stories', 'A Brighter', 'Tomorrow.'],
  tagline: ['Human Creativity.', 'Intelligent Technology.'],
  body: 'We combine human direction, storytelling and design thinking with AI and modern technology to create work that is faster to produce, richer in possibility and built for the future.',
  giant: ['HUMAN', 'CREATIVITY'],
  steps: [
    { n: '01', name: 'Discover', body: 'Understand the idea.' },
    { n: '02', name: 'Create', body: 'Develop the concept and creative direction.' },
    { n: '03', name: 'Build', body: 'Bring it to life.' },
    { n: '04', name: 'Refine', body: 'Make every detail count.' },
  ],
  labelA: ['People', 'drive', 'ideas.', 'Ideas', 'drive', 'change.'],
  labelB: ['Stories', 'that', 'connect.', 'Technology', 'that', 'amplifies.', 'People', 'that', 'create.'],
  labelC: ['Different', 'perspectives.', 'A brighter', 'tomorrow.'],
  labelD: ['A blend of', 'human creativity', 'and AI capabilities', 'to create meaningful', 'experiences.'],
  moreHuman: ['More', 'human', 'ideas.'],
  ideasIntoImpact: ['Ideas', 'into', 'impact.'],
  closing: 'We believe the most powerful ideas happen when human imagination meets technology — creating stories, products and experiences that make a real difference.',
  footer: { left: ['Aivinci Creative Studio', '© 2026'], center: 'Ideas for a brighter tomorrow', right: ['Creative', 'Technology', 'People'] },
}

export interface WorkItem {
  n: string
  title: string
  category: string
}

export const work = {
  label: '04 / Our Work',
  heading: ['Ideas,', 'Brought to Life.'],
  by: 'By Aivinci Creative Studio',
  description: 'A selection of films, campaigns, visual experiences and digital projects created by Aivinci.',
  labels: ['People', 'Ideas', 'Technology', 'Real impact'],
  categories: ['Film', 'Brand', 'Content', 'Experiences'],
  ideasIntoImpact: ['Ideas', 'into', 'impact.'],
  realPeople: ['Real people.', 'Real stories.', 'A brighter tomorrow.'],
  items: [
    { n: '01', title: 'Beyond Limits', category: 'Brand Film' },
    { n: '02', title: 'Urban Pulse', category: 'Social Campaign' },
    { n: '03', title: 'Living Spaces', category: 'Digital Experience' },
    { n: '04', title: 'The Next You', category: 'AI Film' },
  ] as WorkItem[],
  featuredIndex: 3,
}

export const aiVideo = {
  label: '04 / AI Video Story',
  primary: ['We turn AI ideas', 'into real videos.'],
  support: 'From the first idea to the final frame, Aivinci uses AI, creative direction and motion to imagine, create and bring stories to life.',
  process: ['Idea', 'Prompt', 'Frame', 'Motion', 'Story'],
  chapterTitle: ['AI videos: from idea', 'to something real.'],
  chapterSub: 'From the first idea to the final frame.',
  statement: ['An idea becomes a concept.', 'The concept is created with AI.', 'The result becomes a real video.'],
  labelsLeft: ['AI films', 'Commercials', 'Music videos', '& more'],
  labelsRight: ['Ideas', 'People', 'Stories', 'In motion'],
  videos: [
    { id: 'video-01', role: 'first-hero-video', name: 'Video 01', title: 'Idea', sub: 'The first idea.', seconds: 23 },
    { id: 'video-02', role: 'video-two', name: 'Video 02', title: 'Concept', sub: 'The idea becomes a concept.', seconds: 30 },
    { id: 'video-03', role: 'video-three', name: 'Video 03', title: 'Creation', sub: 'Created with AI.', seconds: 15 },
    { id: 'video-04', role: 'last-video', name: 'Video 04', title: 'Real video', sub: 'The final frame.', seconds: 26 },
  ],
  bottomLabels: ['The final frame', 'A real video'],
}

export const workMedia = {
  label: '05 / Products',
  labels: ['Ideas', 'Technology', 'People', 'Products'],
  callout: ['Products for', 'a brighter', 'tomorrow.'],
  heading: ['Explore', 'What’s Next.'],
  marker: '05',
  description: 'Aivinci develops original digital products that combine technology, intelligence and real-world utility.',
  /** the studio portrait supplied with the client feedback ("Founder portrait.jpg") */
  studio: {
    label: 'The Studio',
    hint: 'Ideas · Stories · Products · People',
    heading: ['Ideas, stories,', 'products, people.'],
    side: ['Film', 'Technology', 'Creative business'],
    caption: 'A brighter tomorrow.',
    image: 'founder',
    alt: 'Dhinesh Ravi of Aivinci Creative Studio at his desk — "I don’t follow the future. I build with it."',
  },
}

export const products = {
  label: '05 / Products',
  heading: ['Built by', 'Aivinci.'],
  description: workMedia.description,
  handwriting: ['We build', 'things too.'],
  product: {
    name: 'Zynnect',
    category: 'AI-powered stock research platform',
    description:
      'Zynnect is an AI-powered stock research platform built for Indian investors. It brings stock screening, market intelligence, stock research and AI-assisted analysis into one unified platform.',
    uiText: ['Smarter', 'Investing', 'Starts Here.'],
    uiSub: 'AI-powered stock research for Indian investors.',
    features: [
      { n: '01', name: 'Stock Screening' },
      { n: '02', name: 'Market Intelligence' },
      { n: '03', name: 'Stock Research' },
      { n: '04', name: 'AI-Assisted Analysis' },
    ],
  },
  callout: ['Powerful tools', 'for a brighter', 'tomorrow.'],
  action: ['See Zynnect', 'in action.'],
}

export const productSystem = {
  label: '05 / Product System',
  heading: ['Aivinci', 'Products.'],
  sub: ['Tools', 'for a brighter', 'tomorrow.'],
  chapter: 'Modular product experience',
  labels: ['Ideas', 'Technology', 'People', 'Products'],
  built: ['Built', 'at the', 'intersection', 'of creativity', 'and technology.'],
  tools: ['Tools', 'that turn', 'ideas into', 'real-world', 'impact.'],
  // every card enters bottom → top (client direction)
  cards: [
    { n: '01', tone: 'violet', name: 'Stock Screening' },
    { n: '02', tone: 'blue', name: 'Market Intelligence' },
    { n: '03', tone: 'white', name: 'Stock Research' },
    { n: '04', tone: 'lime', name: 'AI-Assisted Analysis' },
  ] as const,
  product: 'Zynnect',
  productCategory: 'AI-powered stock research platform',
}

export const contact = {
  label: '07 / Contact',
  heading: ['Have an idea?', 'Let’s build it.'],
  description: 'Tell us what you’re thinking. We’d love to hear about your project.',
  handwriting: ['Your idea', 'could be next.'],
  reality: 'Reality',
  labelsLeft: ['Ideas', 'Technology', 'People', 'A brighter', 'tomorrow.'],
  labelsTopA: ['Let’s', 'build', 'what’s', 'next.'],
  labelsTopB: ['AI creative', '& technology', 'studio'],
  form: {
    name: 'Name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    budget: 'Budget',
    budgetHint: 'Approximate project budget',
    budgets: ['$1k – $5k', '$5k – $10k', '$10k – $25k', '$25k – $50k', '$50k – $100k', '$100k+', 'Not sure yet'],
    needs: 'What do you need?',
    needOptions: ['AI Filmmaking', 'Brand & Commercial', 'Social & Digital', 'Creative Technology', 'Digital Experiences', 'Product Development', 'VFX, Animation & Motion', 'Audio, Voice & Music', 'Other'],
    message: 'Tell us about your project',
    optional: 'Optional',
    sending: 'Sending…',
    sent: 'Thank you — your message is on its way to the studio. We’ll be in touch soon.',
    fallback: 'Your mail app should now be open with the message ready to send.',
    failed: 'Something went wrong. Please write to us directly:',
  },
  together: ['A brighter', 'tomorrow', 'together.'],
  footer: { left: ['Aivinci Creative Studio', '© 2026'], center: ['Creative', 'Technology', 'People'], right: ['Ideas', 'People', 'Technology'] },
}

/** the dedicated site footer */
export const footer = {
  statement: ['Ideas for a', 'brighter tomorrow.'],
  navTitle: 'Explore',
  contactTitle: 'Contact',
  followTitle: 'Follow',
  legal: '© 2026 Aivinci Creative Studio. All rights reserved.',
  keywords: ['Creative', 'Technology', 'People'],
}
