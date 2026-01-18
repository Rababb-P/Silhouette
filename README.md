# Silhouette

## Inspiration

Ever stood in front of your closet for 30 minutes, trying on outfit after outfit, only to end up wearing the same thing you always wear? We've all been there. We wanted to create a magic mirror that doesn't just show you what you look like — but shows you what you *could* look like. Think of it as having a personal stylist powered by AI, available 24/7, who never judges your questionable fashion choices.

## What it does

**Silhouette** is your AI-powered fashion advisor. Here's how it works:

1. **Snap a selfie** using the live camera preview
2. **Click on your body** to tell us what you want to change (hate those pants? Click on 'em!)
3. **Pick your vibe** — Streetwear, Formal, or Sporty
4. **Let AI work its magic** — Overshoot analyzes your photo, reads your style preferences, finds improvements and Gemini generates a stunning visualization of your new look
5. **Shop the look** — Get clickable links to actual products that match your recommended outfit

It's like a fitting room that exists in the future... but you can use it today, from your couch, in your pajamas.

## How we built it

We assembled the ultimate tech stack:

- **Frontend**: Next.js 16 + React 19 with a modern UI built on Radix UI components and Tailwind CSS
- **Backend**: Express.js on Node.js, connected to MongoDB Atlas for storing fashion data
- **AI Brains**: 
  - **Google Gemini** for image generation and style recommendations
  - **Overshoot SDK** for real-time video analysis (it literally watches your outfit and understands it)
- **The Glue**: Custom prompt engineering to make the AI understand fashion (teaching robots about drip is harder than it sounds)

## Challenges we ran into

- **Getting AI to understand fashion** — Teaching an AI the difference between "streetwear" and "trying too hard" is... complicated
- **Real-time video analysis** — Processing live camera feeds without melting our laptops
- **The "uncanny valley" of fashion photos** — Making AI-generated outfit visualizations look realistic and not like a fever dream
- **Rate limits** — When you're generating outfit after outfit, Gemini's quota becomes your nemesis
- **Cross-browser compatibility** — Some browsers just don't want you to look good (looking at you, Safari captureStream)

## Accomplishments that we're proud of

- Built a fully functional AI fashion advisor in a hackathon timeframe
- Created a beautiful, intuitive UI that makes body annotation actually fun
- Integrated multiple AI services seamlessly (Overshoot + Gemini working together)
- Made AI-generated fashion photos that people actually want to wear
- Connected real shopping links so you can actually buy the recommended fits
- The "Find Yourself" landing animation turned out great

## What we learned

- AI image generation has come incredibly far — we're living in the future
- Prompt engineering is an art form (and sometimes a comedy of errors)
- Real-time video processing in the browser is both powerful and terrifying
- Building with multiple AI APIs requires serious orchestration skills
- Fashion is subjective, but good UX is universal
- Sleep is optional during hackathons, coffee is not

## What's next for Silhouette

- **Social features** — Share your AI-generated looks with friends and get votes
- **More style vibes** — Cottagecore, Y2K, Dark Academia, and more aesthetics
- **Mobile app** — Fashion advice on the go
- **Direct checkout integration** — One-click to purchase
- **Video try-on** — See how the outfit looks when you move
- **Wardrobe integration** — Upload your existing clothes and get AI-powered outfit combos
- **Brand partnerships** — Connect with fashion retailers for exclusive recommendations

*Because everyone deserves to feel like the main character.*
We utilised Generative AI to build this project (ChatGPT, Github CoPilot, Claude, Cursor)

We also utilised Overshoot API and it's docs. 

Our main IDE in this project was DevSwarm! Using their parrallel AI agent workflows, we were able to get multiple branches of our intial site (frontend, backend) working at once with different AI agents. We then later used DevSwarms multiple workflows to create different reasoning versions of our AI agent and tested to find the best version! Overall, DevSwarm was vital to our project and workflow.
