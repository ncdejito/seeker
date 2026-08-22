import { FlowerAnswers, FlowerFilterCriteria, FlowerPart, FLOWER_PARTS, FLOWER_KEYWORDS_MAP } from './types'

export class FlowerExercise {
  answers: FlowerAnswers

  constructor(answers: FlowerAnswers) {
    this.answers = answers
  }

  getFilterCriteria(): FlowerFilterCriteria {
    const keywords: string[] = []
    let location: string | undefined
    let workStyle: string | undefined
    let peoplePreference: string | undefined
    let conditions: string | undefined
    let purpose: string | undefined

    // Part 1: Who you are - extract skills and values keywords
    keywords.push(...this._extractKeywords(this.answers.part1, 'skills', 'values'))

    // Part 2: What you want to do - extract goals and ambitions
    keywords.push(...this._extractKeywords(this.answers.part2, 'goals', 'ambitions'))

    // Part 3: Where you want to do it - extract location
    const loc = this._extractLocation(this.answers.part3)
    if (loc) location = loc

    // Part 4: How you want to do it - extract working style
    workStyle = this._extractWorkingStyle(this.answers.part4)

    // Part 5: Who you want to do it with - extract people preference
    peoplePreference = this._extractPeoplePreference(this.answers.part5)

    // Part 6: Conditions you'll accept - extract conditions
    conditions = this._extractConditions(this.answers.part6)

    // Part 7: Why you want to do it - extract purpose
    purpose = this._extractPurpose(this.answers.part7)

    return { keywords, location, workStyle, peoplePreference, conditions, purpose }
  }

  private _extractKeywords(text?: string | undefined, ...tags: string[]): string[] {
    if (!text) return []
    const lower = text.toLowerCase()
    const extracted: string[] = []
    
    // Simple keyword extraction - look for common patterns
    const skillPatterns = ['python', 'javascript', 'react', 'node', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ml', 'ai', 'data', 'analysis', 'management', 'lead', 'design', 'ux', 'ui']
    for (const pattern of skillPatterns) {
      if (lower.includes(pattern)) {
        extracted.push(pattern)
      }
    }
    
    // Add tagged keywords
    for (const tag of tags) {
      if (lower.includes(tag)) {
        extracted.push(tag)
      }
    }
    
    return extracted
  }

  private _extractLocation(text?: string | undefined): string | undefined {
    if (!text) return undefined
    const lower = text.toLowerCase()
    // Common location keywords
    const cities = ['london', 'paris', 'berlin', 'new york', 'sf', 'san francisco', 'remote']
    for (const city of cities) {
      if (lower.includes(city)) return city
    }
    return undefined
  }

  private _extractWorkingStyle(text?: string | undefined): string | undefined {
    if (!text) return undefined
    const lower = text.toLowerCase()
    if (lower.includes('remote') || lower.includes('work from home')) return 'remote'
    if (lower.includes('flexible') || lower.includes('flex')) return 'flexible'
    if (lower.includes('office') || lower.includes('on-site')) return 'on-site'
    if (lower.includes('independent') || lower.includes('solo')) return 'independent'
    return undefined
  }

  private _extractPeoplePreference(text?: string | undefined): string | undefined {
    if (!text) return undefined
    const lower = text.toLowerCase()
    if (lower.includes('team') || lower.includes('collaborative')) return 'team-oriented'
    if (lower.includes('solo') || lower.includes('independent')) return 'independent'
    if (lower.includes('management') || lower.includes('lead')) return 'leadership'
    return undefined
  }

  private _extractConditions(text?: string | undefined): string | undefined {
    if (!text) return undefined
    const lower = text.toLowerCase()
    if (lower.includes('salary') || lower.includes('compensation')) return 'salary'
    if (lower.includes('benefits') || lower.includes('health')) return 'benefits'
    if (lower.includes('hours') || lower.includes('work-life')) return 'work-life balance'
    if (lower.includes('remote') || lower.includes('flexible')) return 'flexible hours'
    return undefined
  }

  private _extractPurpose(text?: string | undefined): string | undefined {
    if (!text) return undefined
    const lower = text.toLowerCase()
    if (lower.includes('impact') || lower.includes('purpose')) return 'impact'
    if (lower.includes('learning') || lower.includes('growth')) return 'learning'
    if (lower.includes('money') || lower.includes('financial')) return 'financial'
    if (lower.includes('help') || lower.includes('service')) return 'service'
    return undefined
  }
}