# Seven Parts of the Flower — User Self-Assessment (JSON Output)

**Purpose**: Capture your career preferences from Richard Bolles' *What Color is Your Parachute* exercise. Provide answers in JSON format for direct use with Seeker's job matching pipeline.

**How to use**: Answer each of the 7 parts below. You can talk through these with your AI assistant. The output should be a JSON object with keys `part1` through `part7`, which you can export as environment variables or pass directly to the Seeker pipeline.

---

## Part 1 — Who You Are

> *Your fundamental identity, values, and what makes you unique*

**Guide questions**:
- What are your core values at work?
- What unique skills or perspectives do you bring?
- What type of person are you in a work context?
- What accomplishments are you most proud of?
- What does "good fit" feel like for your identity?

**Your answer** (free text - will be placed in JSON `part1` field):

---

## Part 2 — What You Want to Do

> *Your goals, ambitions, and the type of work you're drawn to*

**Guide questions**:
- What problems do you want to solve?
- What tasks energize you vs drain you?
- What kind of projects excite you?
- What would you do even if you weren't getting paid?
- What's your ideal day-to-day work?

**Your answer** (free text - will be placed in JSON `part2` field):

---

## Part 3 — Where You Want to Do It

> *Location, environment, and geographic preferences*

**Guide questions**:
- What city/region do you want to work in?
- Remote, hybrid, or on-site preferred?
- Climate or environment matters?
- Willing to relocate? For what kind of role?
- Time zone constraints?

**Your answer** (free text - will be placed in JSON `part3` field):

---

## Part 4 — How You Want to Do It

> *Your working style, preferences for structure vs flexibility*

**Guide questions**:
- Preferred work structure: formal vs informal?
- Independence vs collaboration needed?
- Hours/days that work best?
- Decision-making style preferred?
- Communication style preferences?

**Your answer** (free text - will be placed in JSON `part4` field):

---

## Part 5 — Who You Want to Do It With

> *Workplace culture, team dynamics, and people you prefer to work with*

**Guide questions**:
- Team size preferred?
- Management style that works for you?
- Culture traits you value (transparency, innovation, stability)?
- People types you thrive with vs avoid?
- Diversity/ inclusion priorities?

**Your answer** (free text - will be placed in JSON `part5` field):

---

## Part 6 — Conditions You'll Accept

> *Salary, benefits, work hours, and other practical conditions*

**Guide questions**:
- Minimum salary expectation?
- Benefits essential vs nice-to-have?
- Work hours flexibility needed?
- Vacation/priority time off minimums?
- Other practical constraints?

**Your answer** (free text - will be placed in JSON `part6` field):

---

## Part 7 — Why You Want to Do It

> *Purpose, motivation, and what drives you in your career*

**Guide questions**:
- What impact do you want to make?
- What's your deeper purpose/meaning?
- What motivates you beyond the paycheck?
- How does this role fit your life purpose?
- What legacy do you want to leave?

**Your answer** (free text - will be placed in JSON `part7` field):

---

## Expected Output Format: JSON

Provide your answers as a JSON object with the following structure. This is the format Seeker expects via environment variables `FLOWER_PART1` through `FLOWER_PART7` or direct JSON input:

```json
{
  "part1": "Your answer for Part 1: Who You Are",
  "part2": "Your answer for Part 2: What You Want to Do",
  "part3": "Your answer for Part 3: Where You Want to Do It",
  "part4": "Your answer for Part 4: How You Want to Do It",
  "part5": "Your answer for Part 5: Who You Want to Do It With",
  "part6": "Your answer for Part 6: Conditions You'll Accept",
  "part7": "Your answer for Part 7: Why You Want to Do It"
}
```

### Example JSON Output

```json
{
  "part1": "Python developer with 5 years experience. Core values: integrity, collaboration, continuous learning. I thrive on solving complex problems and mentoring junior team members.",
  "part2": "Want to work on AI/ML projects that have measurable impact on business outcomes. Interested in MLOps, model deployment, and scalable data pipelines. Excited by greenfield projects from scratch.",
  "part3": "Prefer London or remote within GMT timezone. Willing to consider Europe-wide roles. Home office setup must have dual monitors and quiet environment.",
  "part4": "Like flexible working hours with core collaboration time 10am-4pm. Independent deep work preferred but small group collaboration essential. Asynchronous communication tools must work well.",
  "part5": "Enjoy working in small teams of 3-5 people with flat hierarchy. Value psychological safety and open feedback. Prefer teams that value diversity of thought and inclusive decision-making.",
  "part6": "Salary above 50k with good health benefits and 25 days vacation. Remote work essential. Equipment stipend valued. Work-life balance must allow evening family time.",
  "part7": "Want to make an impact through technology that improves people's lives or solves environmental challenges. Motivated by seeing tangible outcomes from my work. Legacy matters: want to help build systems that last and help others."
}
```

### Using the JSON with Seeker

#### Option 1: Environment Variables

Extract each part and export as separate environment variables:

```bash
export FLOWER_PART1="Your answer for Part 1"
export FLOWER_PART2="Your answer for Part 2"
export FLOWER_PART3="Your answer for Part 3"
export FLOWER_PART4="Your answer for Part 4"
export FLOWER_PART5="Your answer for Part 5"
export FLOWER_PART6="Your answer for Part 6"
export FLOWER_PART7="Your answer for Part 7"

npm run pipeline
```

#### Option 2: Direct JSON Input

If you have a CLI or API that accepts JSON, pass the entire object:

```bash
# Example - depends on your Seeker implementation
seeker run --flower-assessment='{"part1":"...","part2":"...",...,"part7":"..."}'
```

### Integration with Seeker Pipeline

Once your JSON is provided, Seeker's pipeline:

1. **Parses** your 7 parts into filter criteria (keywords, location, work style, etc.)
2. **Filters** job titles against your goals and values (Part 1-2)
3. **Adjusts** technical fit scoring based on relevant skill keywords (Part 1)
4. **Influences** aspirational fit dimensions based on your preferences (Parts 3-7)
5. **Matches** resumes against jobs considering your stated people/condition preferences (Parts 4-6)
6. **Scores** overall flower fit (0-100) using the LLM prompt `prompts/flower-fit.txt`
7. **Recommends** "Apply"/"Upskill First"/"Look Elsewhere" based on total fit + flower alignment

### Tips for Best Results

- **Answer in complete sentences** - the AI will parse these better for keyword extraction
- **Be specific** - concrete examples give better filtering than vague desires
- **It's OK to have trade-offs** - express competing preferences across different parts
- **Refine over time** - revisit your answers as your career evolves
- **Use the example** above as a template for your own answers

### Quick Workflow

1. Talk through the 7 parts with your AI assistant
2. Copy the example JSON structure
3. Replace each `partN` value with your answer
4. Export environment variables or pass JSON to Seeker
5. Run `npm run pipeline` to get flower-informed job matches