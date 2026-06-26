# WRITEUP

## 1. Why you, why us

### Why you

In my opinion, I'm an extremely disciplined and responsible developer. I always strive for the cleanest way to do things and meet deadlines. With me, you won't have any issues with commitment, adaptability, results, etc., as I'm aware of my responsibilities and understand that nothing is achieved without discipline and dedication.

I have considerable experience with most of the technologies you use, primarily because my approach to AI is based on the Claude ecosystem, utilizing all its tools, which aligns very well with your AI workflow.

One of my greatest strengths is my prior experience in the sector of the project I'm joining. At WeAreDev, I was developing a platform for tracking time, projects, clients, and employees for internal use and as a SaaS offering. I served as the lead developer, using a stack almost identical to OCMI's: a monorepo, Express + PostgreSQL on the backend, Next.js on the frontend, React Native for mobile, and multi-tenancy.

Honestly, one weakness I see in your stack is that I've been focused on the backend with frameworks like Express, Nest.js, and Fastify, while you use Hono. But honestly, while testing it, I realized it's very similar to Express, so it wasn't hard for me to understand the architecture and work with it comfortably.

### Why us

I come from working at startups and as a freelancer, paid hourly or on a service contract basis, which can generate good earnings but not stability. The person who referred me to this vacancy, Giancarlo Cabrera, a technical lead at OCMI Workers, has spoken to me for some time about his work style, the job stability, and the potential for growth within the company. I know that Giancarlo started as a developer and rose to technical lead. Basically, that's what I'm looking for now: a company that offers stability so I can grow within the company and reach higher roles, learn more, and expand and improve my professional profile. In unstable companies, the effort you put in goes to waste because you can't advance. Finally, I'm very interested in working with OCMI because I see that they handle AI professionally, and I know that's the future, so I'd like to enhance my AI skills.

---

## 2. Decisions and trade-offs

### Decision 1 — Spec Architecture

At the start of the project, I was thinking about how comprehensive the spec structure would be to guide the AI. I could have easily created a very basic structure with a few instruction files per module, giving me more time to write real code. After careful consideration, I decided to take the time to build a clean architecture for each feature, centralizing them in a checklist plan. This way, when I started coding, I would be more organized in following the established path and avoid making decisions on the fly. This decision yielded excellent results, as the AI was able to follow my specs and had a clean and organized guide.

### Decision 2 — Integration Tests Against a Real Database (No Mocks)

While testing the API, I decided to test the services for each module. The problem was that I hadn't separated the services from the database queries, as the logic was mostly very short and simple. Upon seeing this, I faced a decision: write unit tests by mocking the database and save time, or create integration tests using a test database. Ultimately, I decided to take the option that added more value to the application with a test database, since it tests real-world scenarios against Postgres, unlike unit tests that mock the database.

### Decision 3 — i18n Migration Midway (react-i18next → next-intl)

When I started building the frontend, I had chosen the react-i18next library because it was more stable and had more documentation. However, as I progressed, configuring it to be multilingual, I realized that this library was having problems with Next's SSR, so I had to implement workarounds. Seeing this, halfway through building the frontend, I decided to accept the time loss by using a library called next-intl, native to SSR, which allowed me to remove the patches and leave a much cleaner and easier-to-understand structure. Ultimately, I think that change allowed me to move faster with the remaining specs, compared to if I had continued using react-i18next.

### Closing — What would I do differently in production with a team?

If this had been a production application with a large team, I would have taken more time to create the entire structure of specs, skills, agents, documentation, and validations of architectural decisions, technologies, and libraries. If this foundation is well-established and robust, the developers themselves can share a clear context for the AI. Then, during development, they will follow the same practices, rules, methods, etc., ensuring a smooth workflow and preventing each developer from coding in their own way.

---

## 2.1 Questions

**1. How many years of experience do you have with mobile development, specifically React Native?**

I have about a year and a half of experience with React Native, starting with WeAreDev when I had to create a mobile version of a time tracking and business management project using React Native. Following that, at my current company, we are currently creating the mobile version of a product called PXO Token, a monorepo application using a backend in Nest.js and Prisma and a frontend in Next.js. We are currently using React Native with Expo, so I've been familiarizing myself with this framework. Although my strength is web, in which I have a lot of experience, mobile isn't a problem for me. I understand the concepts, and with the help of AI and best practices, you can quickly learn new stacks.

**2. What development environment will you be using? (OS, Processor, RAM)**

- **OS:** Windows 11 Home Single Language (64-bit)
- **Processor:** AMD Ryzen 7 4800H (8 cores / 16 threads)
- **RAM:** 16 GB
